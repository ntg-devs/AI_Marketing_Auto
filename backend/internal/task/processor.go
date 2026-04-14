package task

import (
	"bityagi/internal/domain"
	"bityagi/pkg/crawlerclient"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"bityagi/pkg/llm"
	"bityagi/pkg/mail"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

type TaskProcessor interface {
	Start() error
	ProcessTaskGenerateContent(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendWelcomeEmail(ctx context.Context, task *asynq.Task) error
	ProcessTaskCrawlSourceURL(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server        *asynq.Server
	mailer        *mail.SMTPSender
	crawlRepo     domain.CrawlRepository
	aiRepo        domain.AIProviderRepository
	crawlerClient crawlerclient.Client
}

func NewRedisTaskProcessor(
	redisOpt asynq.RedisConnOpt,
	mailer *mail.SMTPSender,
	crawlRepo domain.CrawlRepository,
	aiRepo domain.AIProviderRepository,
	crawlerClient crawlerclient.Client,
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
	}
}

func (p *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeGenerateContent, p.ProcessTaskGenerateContent)
	mux.HandleFunc(TypeSendWelcomeEmail, p.ProcessTaskSendWelcomeEmail)
	mux.HandleFunc(TypeCrawlSourceURL, p.ProcessTaskCrawlSourceURL)

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

	result, err := p.crawlerClient.Crawl(ctx, &crawlerclient.CrawlRequest{
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
				result.ExtractedText = optimizedContext
				log.Printf("Worker: [LLM Pipeline] ✅ EXTRACTION SUCCESSFUL! Extracted %d characters of optimized context.", len(optimizedContext))
				// Print the AI extracted content for debugging
				preview := optimizedContext
				if len(preview) > 2000 {
					preview = preview[:2000] + "\n... [TRUNCATED]"
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
