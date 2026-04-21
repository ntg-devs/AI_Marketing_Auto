package task

import (
	"bityagi/internal/domain"
	"bityagi/pkg/crawlerclient"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"bityagi/pkg/llm"
	"bityagi/pkg/mail"
	"bityagi/pkg/vertexsearch"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

type TaskProcessor interface {
	Start() error
	ProcessTaskGenerateContent(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendWelcomeEmail(ctx context.Context, task *asynq.Task) error
	ProcessTaskCrawlSourceURL(ctx context.Context, task *asynq.Task) error
	ProcessTaskAnalyzeImageURL(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server        *asynq.Server
	mailer        *mail.SMTPSender
	crawlRepo     domain.CrawlRepository
	aiRepo        domain.AIProviderRepository
	crawlerClient crawlerclient.Client
	vertexClient  vertexsearch.Client
}

func NewRedisTaskProcessor(
	redisOpt asynq.RedisConnOpt,
	mailer *mail.SMTPSender,
	crawlRepo domain.CrawlRepository,
	aiRepo domain.AIProviderRepository,
	crawlerClient crawlerclient.Client,
	vertexClient vertexsearch.Client,
) TaskProcessor {
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Queues: map[string]int{
				"critical": 6,
				"default":  4,
				"crawl":    3,
				"low":      1,
			},
		},
	)
	return &RedisTaskProcessor{
		server:        server,
		mailer:        mailer,
		crawlRepo:     crawlRepo,
		aiRepo:        aiRepo,
		crawlerClient: crawlerClient,
		vertexClient:  vertexClient,
	}
}

func (p *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeGenerateContent, p.ProcessTaskGenerateContent)
	mux.HandleFunc(TypeSendWelcomeEmail, p.ProcessTaskSendWelcomeEmail)
	mux.HandleFunc(TypeCrawlSourceURL, p.ProcessTaskCrawlSourceURL)
	mux.HandleFunc(TypeAnalyzeImageURL, p.ProcessTaskAnalyzeImageURL)

	return p.server.Run(mux)
}

func (p *RedisTaskProcessor) ProcessTaskGenerateContent(ctx context.Context, t *asynq.Task) error {
	var payload GenerateContentPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	// TODO: Integrate OpenAI/Gemini here
	log.Printf("Worker: Generating AI content for user %s with prompt: %s\n", payload.UserID, payload.Prompt)

	return nil
}

func (p *RedisTaskProcessor) ProcessTaskSendWelcomeEmail(ctx context.Context, t *asynq.Task) error {
	var payload SendWelcomeEmailPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	if payload.OTP != "" {
		log.Printf("Worker: Sending OTP email to %s (%s). OTP Code: %s\n", payload.UserEmail, payload.FullName, payload.OTP)

		// Render HTML body
		htmlBody, err := mail.GenerateOTPTemplate(payload.FullName, payload.OTP)
		if err != nil {
			return fmt.Errorf("could not generate OTP template: %w", err)
		}

		// Send email if mailer is configured
		if p.mailer != nil && p.mailer.Host != "" {
			err = p.mailer.SendEmail([]string{payload.UserEmail}, "Verify your AetherFlow account", htmlBody)
			if err != nil {
				return fmt.Errorf("could not send SMTP email: %w", err)
			}
			log.Println("Worker: SMTP Email successfully delivered.")
		} else {
			log.Println("Worker: SMTP is not configured. Email bypassed.")
		}

	} else {
		log.Printf("Worker: Sending welcome email to %s (%s)\n", payload.UserEmail, payload.FullName)
		// For welcome emails without OTP...
	}

	return nil
}

func (p *RedisTaskProcessor) ProcessTaskCrawlSourceURL(ctx context.Context, t *asynq.Task) error {
	if p.crawlRepo == nil {
		return fmt.Errorf("crawl repository is not configured")
	}
	if p.crawlerClient == nil {
		return fmt.Errorf("crawler client is not configured")
	}

	var payload CrawlSourceURLPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	if err := p.crawlRepo.MarkJobRunning(ctx, payload.JobID); err != nil {
		return fmt.Errorf("could not mark crawl job as running: %w", err)
	}

	var result *domain.CrawlExtractionResult
	var err error

	// Priority: If strategy is search and Vertex AI Search is configured, use it.
	if payload.Strategy == domain.CrawlStrategySearch && p.vertexClient != nil {
		log.Printf("Worker: Performing Search using Vertex AI Search for query: %s", payload.URL)
		
		searchResults, sErr := p.vertexClient.Search(ctx, payload.URL)
		if sErr == nil {
			// Convert SearchResults to CrawlExtractionResult
			pages := make([]domain.CrawlPageResult, 0, len(searchResults))
			combinedMarkdown := fmt.Sprintf("# Vertex AI Search Results for: %s\n\n", payload.URL)
			
			for _, r := range searchResults {
				pages = append(pages, domain.CrawlPageResult{
					URL:           r.URL,
					Title:         r.Title,
					Depth:         0,
					ContentType:   "text/html",
					Status:        "processed",
					ExtractedText: r.Snippet,
					MarkdownText:  fmt.Sprintf("### [%s](%s)\n%s", r.Title, r.URL, r.Snippet),
					Metadata:      map[string]interface{}{"snippet": r.Snippet},
				})
				combinedMarkdown += fmt.Sprintf("### [%s](%s)\n%s\n\n", r.Title, r.URL, r.Snippet)
			}

			result = &domain.CrawlExtractionResult{
				FinalURL:      payload.URL,
				StrategyUsed:  domain.CrawlStrategySearch,
				ProviderUsed:  "google/vertex-ai-search",
				HTTPStatus:    200,
				Title:         fmt.Sprintf("Vertex Search: %s", payload.URL),
				Description:   fmt.Sprintf("Real-time results from Vertex AI for: %s", payload.URL),
				Language:      "vi",
				Markdown:      combinedMarkdown,
				ExtractedText: combinedMarkdown,
				Pages:         pages,
				Metadata:      map[string]interface{}{"search_results_count": len(searchResults)},
			}
		} else {
			log.Printf("Worker: Vertex AI Search failed: %v. Falling back to default crawler.", sErr)
		}
	}

	// If result is still nil (not a search or vertex failed), use default crawler
	if result == nil {
		result, err = p.crawlerClient.Crawl(ctx, &crawlerclient.CrawlRequest{
			URL:         payload.URL,
			Strategy:    payload.Strategy,
			MaxPages:    payload.MaxPages,
			UseStealth:  payload.UseStealth,
			ProxyRegion: payload.ProxyRegion,
		})
		if err != nil {
			_ = p.crawlRepo.MarkJobFailed(ctx, payload.JobID, err.Error())
			return fmt.Errorf("crawler request failed: %w", err)
		}
	}

	// ----------------------------------------------------------------------
	// Móc API OpenAI/Gemini/Claude vào Pipeline bằng cấu hình động của User
	// ----------------------------------------------------------------------
	if p.aiRepo != nil {
		var teamID uuid.UUID
		job, _ := p.crawlRepo.GetJobByID(ctx, payload.JobID)
		if job != nil {
			teamID = job.TeamID
		}
		config, err := p.aiRepo.GetDefaultConfig(ctx, teamID)

		apiKey := ""
		baseURL := ""
		modelName := ""
		providerName := ""
		if err == nil && config != nil && config.APIKey != "" {
			apiKey = config.APIKey
			baseURL = config.BaseURL
			modelName = config.ModelName
			providerName = config.ProviderName
			log.Printf("Worker: Using dynamic AI config — Provider: %s, Model: %s", providerName, modelName)
		} else {
			apiKey = os.Getenv("OPENAI_API_KEY")
			if apiKey != "" {
				log.Println("Worker: No dynamic AI config found, falling back to OPENAI_API_KEY env var")
			}
		}

		if apiKey != "" && result.Markdown != "" {
			log.Printf("Worker: [LLM Pipeline] Connecting to provider '%s' using model '%s'...", providerName, modelName)
			if baseURL != "" {
				log.Printf("Worker: [LLM Pipeline] Using custom API endpoint: %s", baseURL)
			}
			log.Printf("Worker: [LLM Pipeline] Starting extraction for %s (Content length: %d chars)...", payload.URL, len(result.Markdown))

			aiClient := llm.NewClientWithConfig(apiKey, baseURL, modelName, providerName)
			optimizedContext, err := aiClient.SummarizeAndExtract(ctx, result.Markdown, llm.ExtractionContext{
				Persona:          "Chuyên gia công nghệ, người làm marketing hoặc nhà sáng tạo nội dung",
				PreviousCampaign: "Chưa có thông tin chiến dịch cũ",
			})

			if err != nil {
				log.Printf("Worker: [LLM Pipeline] ❌ EXTRACTION FAILED for %s. Error: %v", payload.URL, err)
			} else {
				// Combined context support: Prepend image analysis if available
				if payload.ImageURL != "" {
					log.Printf("Worker: [Combined Pipeline] Injecting vision analysis for %s...", payload.ImageURL)
					imageSummary, _, imageMeta, err := p.analyzeImageInternal(ctx, payload.ImageURL)
					if err == nil {
						optimizedContext = fmt.Sprintf("### VISION ANALYSIS (REFERENCE IMAGE)\n%s\n\n### WEB CONTENT ANALYSIS\n%s", imageSummary, optimizedContext)
						
						// Store vision metadata in result metadata for frontend access
						if result.Metadata == nil {
							result.Metadata = make(map[string]interface{})
						}
						result.Metadata["image_analysis"] = imageMeta
						result.Metadata["source_image_url"] = payload.ImageURL
						
						log.Printf("Worker: [Combined Pipeline] ✅ Successfully merged vision and web contexts")
					} else {
						log.Printf("Worker: [Combined Pipeline] ⚠️ Vision analysis failed (skipping merge): %v", err)
					}
				}

				result.ExtractedText = optimizedContext
				log.Printf("Worker: [LLM Pipeline] ✅ EXTRACTION SUCCESSFUL! Extracted %d characters of optimized context.", len(optimizedContext))
				// Print the AI extracted content for debugging
				preview := optimizedContext
				if len(preview) > 1000 {
					preview = preview[:1000] + "\n... [TRUNCATED]"
				}
				log.Printf("Worker: [LLM Pipeline] === AI EXTRACTED CONTENT ===\n%s\n=== END OF CONTENT ===", preview)

				// Embedding chỉ tương thích với OpenAI — Gemini/Anthropic không có endpoint này
				if aiClient.IsOpenAI() {
					log.Println("Worker: Generating Embeddings for RAG (text-embedding-3-small)...")
					_, tokenCount, embedErr := aiClient.GenerateEmbedding(ctx, optimizedContext)
					if embedErr == nil {
						result.VectorID = "pinecone_vec_" + payload.JobID.String()
						result.EmbeddingModel = "text-embedding-3-small"
						result.TokenCount = tokenCount
						log.Printf("Worker: Embedding successful. Generated VectorID: %s, %d tokens", result.VectorID, tokenCount)
					} else {
						log.Printf("Worker: Warning - Embedding failed. Error: %v", embedErr)
					}
				} else {
					log.Printf("Worker: Skipping Embedding (provider '%s' does not support text-embedding-3-small)", providerName)
				}
			}
		} else {
			log.Println("Worker: API Key is empty or crawled content is empty. Skipping LLM Pipeline.")
		}
	} else {
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey != "" && result.Markdown != "" {
			log.Printf("Worker: Digesting context for %s using env OPENAI_API_KEY...", payload.URL)
			aiClient := llm.NewClientWithConfig(apiKey, "", "", "openai")
			optimizedContext, err := aiClient.SummarizeAndExtract(ctx, result.Markdown, llm.ExtractionContext{
				Persona:          "Chuyên gia công nghệ, người làm marketing hoặc nhà sáng tạo nội dung",
				PreviousCampaign: "Chưa có thông tin chiến dịch cũ",
			})
			if err != nil {
				log.Printf("Worker: [LLM Pipeline-Fallback] ❌ EXTRACTION FAILED for %s. Error: %v", payload.URL, err)
			} else {
				// Combined context support: Prepend image analysis if available
				if payload.ImageURL != "" {
					imageSummary, _, imageMeta, err := p.analyzeImageInternal(ctx, payload.ImageURL)
					if err == nil {
						optimizedContext = fmt.Sprintf("### VISION ANALYSIS (REFERENCE IMAGE)\n%s\n\n### WEB CONTENT ANALYSIS\n%s", imageSummary, optimizedContext)
						
						// Store vision metadata in result metadata
						if result.Metadata == nil {
							result.Metadata = make(map[string]interface{})
						}
						result.Metadata["image_analysis"] = imageMeta
						result.Metadata["source_image_url"] = payload.ImageURL
					}
				}
				result.ExtractedText = optimizedContext
				log.Printf("Worker: [LLM Pipeline-Fallback] ✅ EXTRACTION SUCCESSFUL! Extracted %d characters.", len(optimizedContext))
			}
		} else {
			log.Println("Worker: OPENAI_API_KEY is not set or content is empty. Skipping LLM Pipeline.")
		}
	}

	if err := p.crawlRepo.SaveJobResult(ctx, payload.JobID, result); err != nil {
		_ = p.crawlRepo.MarkJobFailed(ctx, payload.JobID, err.Error())
		return fmt.Errorf("could not save crawl result: %w", err)
	}

	log.Printf("Worker: Completed crawl job %s for %s\n", payload.JobID, payload.URL)
	return nil
}

// ProcessTaskAnalyzeImageURL handles image URL analysis using local Ollama LLaVA model.
// Pipeline: Download Image → Base64 Encode → LLaVA Analysis → Save to Knowledge Base
// ProcessTaskAnalyzeImageURL handles standalone image URL analysis.
func (p *RedisTaskProcessor) ProcessTaskAnalyzeImageURL(ctx context.Context, t *asynq.Task) error {
	if p.crawlRepo == nil {
		return fmt.Errorf("crawl repository is not configured")
	}

	var payload AnalyzeImageURLPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	log.Printf("Worker: [Image Pipeline] Starting standalone analysis for job %s — URL: %s", payload.JobID, payload.ImageURL)

	if err := p.crawlRepo.MarkJobRunning(ctx, payload.JobID); err != nil {
		return fmt.Errorf("could not mark job as running: %w", err)
	}

	enhancedContext, _, metadata, err := p.analyzeImageInternal(ctx, payload.ImageURL)
	if err != nil {
		_ = p.crawlRepo.MarkJobFailed(ctx, payload.JobID, err.Error())
		return err
	}

	result := &domain.CrawlExtractionResult{
		FinalURL:      payload.ImageURL,
		StrategyUsed:  domain.CrawlStrategyImage,
		ProviderUsed:  "ollama/llava",
		HTTPStatus:    200,
		Title:         fmt.Sprintf("Image Analysis: %s", metadata.Theme),
		Description:   metadata.Description,
		ContentType:   "image/jpeg", // approximate
		ExtractedText: enhancedContext,
		Markdown:      metadata.Description,
		Metadata: map[string]interface{}{
			"image_analysis": metadata,
			"source_type":    "image_analysis",
			"image_url":      payload.ImageURL,
		},
	}

	if err := p.crawlRepo.SaveJobResult(ctx, payload.JobID, result); err != nil {
		_ = p.crawlRepo.MarkJobFailed(ctx, payload.JobID, err.Error())
		return fmt.Errorf("could not save standalone image analysis result: %w", err)
	}

	log.Printf("Worker: [Image Pipeline] Standalone job %s completed", payload.JobID)
	return nil
}

// analyzeImageInternal performs the core vision analysis logic, shared by standalone and combined tasks.
func (p *RedisTaskProcessor) analyzeImageInternal(ctx context.Context, imageURL string) (enhancedContext string, knowledgeText string, metadata domain.ImageAnalysisResult, err error) {
	log.Printf("Worker: [Vision Helper] Analyzing %s...", imageURL)

	// 1. Download image
	imageData, mimeType, err := downloadImage(imageURL)
	if err != nil {
		return "", "", domain.ImageAnalysisResult{}, fmt.Errorf("failed to download image: %v", err)
	}

	// 2. Encode to base64
	imageBase64 := base64.StdEncoding.EncodeToString(imageData)

	// 3. Connection Setup
	ollamaBaseURL := os.Getenv("OLLAMA_BASE_URL")
	if ollamaBaseURL == "" {
		ollamaBaseURL = "http://127.0.0.1:11434/v1"
	}

	// 4. LLaVA Analysis
	visionClient := llm.NewOllamaVisionClient(ollamaBaseURL)
	analysisJSON, err := visionClient.AnalyzeImage(ctx, imageBase64, mimeType)
	if err != nil {
		return "", "", domain.ImageAnalysisResult{}, fmt.Errorf("LLaVA analysis failed: %v", err)
	}

	// 5. Parse JSON
	var analysisResult domain.ImageAnalysisResult
	if err := json.Unmarshal([]byte(analysisJSON), &analysisResult); err != nil {
		analysisResult = domain.ImageAnalysisResult{
			Description: analysisJSON,
			Theme:       "Unknown",
		}
	}
	analysisResult.ImageURL = imageURL

	// 6. Format as Knowledge
	knowledgeText = llm.FormatImageAnalysisAsKnowledge(analysisJSON, imageURL)

	// 7. Text Enhancement (Qwen)
	ollamaTextModel := os.Getenv("OLLAMA_TEXT_MODEL")
	if ollamaTextModel == "" {
		ollamaTextModel = "qwen2.5:3b"
	}
	textClient := llm.NewOllamaTextClient(ollamaBaseURL, ollamaTextModel)
	enhancedContext, err = textClient.SummarizeAndExtract(ctx, knowledgeText, llm.ExtractionContext{
		Persona: "Chuyên gia marketing và sáng tạo nội dung từ hình ảnh",
	})
	if err != nil {
		log.Printf("Worker: [Vision Helper] ⚠️ Secondary enhancement failed: %v", err)
		enhancedContext = knowledgeText
	}

	return enhancedContext, knowledgeText, analysisResult, nil
}

// downloadImage fetches an image from URL or decodes a base64 data URI
func downloadImage(imageURL string) ([]byte, string, error) {
	// Handle Base64 Data URI directly
	if strings.HasPrefix(imageURL, "data:image/") {
		parts := strings.SplitN(imageURL, ",", 2)
		if len(parts) != 2 {
			return nil, "", fmt.Errorf("invalid data URI format")
		}
		
		metaParts := strings.Split(parts[0], ";")
		mimeType := strings.TrimPrefix(metaParts[0], "data:")
		
		isBase64 := false
		for _, p := range metaParts {
			if p == "base64" {
				isBase64 = true
				break
			}
		}
		
		if !isBase64 {
			return nil, "", fmt.Errorf("only base64 encoded data URIs are supported")
		}
		
		data, err := base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, "", fmt.Errorf("failed to decode base64 image data: %w", err)
		}
		
		return data, mimeType, nil
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(imageURL)
	if err != nil {
		return nil, "", fmt.Errorf("HTTP GET failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	// Detect MIME type from Content-Type header
	contentType := resp.Header.Get("Content-Type")
	mimeType := "image/jpeg" // default
	if contentType != "" {
		parts := strings.SplitN(contentType, ";", 2)
		mimeType = strings.TrimSpace(parts[0])
	}

	// Validate it's an image
	if !strings.HasPrefix(mimeType, "image/") {
		return nil, "", fmt.Errorf("URL does not point to an image (Content-Type: %s)", contentType)
	}

	// Read with 10MB limit
	maxSize := int64(10 * 1024 * 1024)
	limitedReader := io.LimitReader(resp.Body, maxSize+1)
	data, err := io.ReadAll(limitedReader)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read image body: %w", err)
	}
	if int64(len(data)) > maxSize {
		return nil, "", fmt.Errorf("image too large (max 10MB, got %d bytes)", len(data))
	}

	return data, mimeType, nil
}

func truncateStr(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
