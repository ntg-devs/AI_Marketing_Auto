package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/sashabaranov/go-openai"
)

type Client struct {
	client       *openai.Client
	modelName    string
	providerName string // "openai", "gemini", "anthropic"
}

// NewClient initializes a new OpenAI client using the provided apiKey.
func NewClient(apiKey string) *Client {
	return NewClientWithConfig(apiKey, "", "", "")
}

// NewClientWithConfig initializes a new client with dynamic model and BaseURL for providers like Gemini.
// providerName is used for conditional logic (e.g., skip embedding for non-OpenAI).
func NewClientWithConfig(apiKey, baseURL, modelName, providerName string) *Client {
	cfg := openai.DefaultConfig(apiKey)

	// Auto-detect provider from model name if providerName is empty
	if providerName == "" {
		if strings.HasPrefix(modelName, "gemini") {
			providerName = "gemini"
		} else if strings.HasPrefix(modelName, "claude") {
			providerName = "anthropic"
		} else if strings.HasPrefix(modelName, "qwen") || strings.HasPrefix(modelName, "llama") || strings.Contains(strings.ToLower(modelName), "ollama") {
			providerName = "ollama"
		} else {
			providerName = "openai"
		}
	}

	// Auto-inject the correct Base URL for non-OpenAI providers
	if baseURL != "" {
		cfg.BaseURL = baseURL
	} else if providerName == "gemini" {
		// Gemini's OpenAI-compatible endpoint (REQUIRED, not optional)
		cfg.BaseURL = "https://generativelanguage.googleapis.com/v1beta/openai/"
	} else if providerName == "ollama" {
		// Default Ollama local endpoint
		cfg.BaseURL = "http://127.0.0.1:11434/v1"
		// Ollama doesn't strictly need a valid API key, but openai client might complain if empty
		if apiKey == "" {
			cfg.EmptyMessagesLimit = 5
			apiKey = "ollama" // dummy key
			cfg = openai.DefaultConfig(apiKey)
			cfg.BaseURL = "http://127.0.0.1:11434/v1"
		}
	}

	actualModel := openai.GPT4o
	if modelName != "" && modelName != "default" {
		actualModel = modelName
	}

	return &Client{
		client:       openai.NewClientWithConfig(cfg),
		modelName:    actualModel,
		providerName: providerName,
	}
}

// IsOpenAI returns true if this client is connected to OpenAI (needed for embedding compatibility).
func (c *Client) IsOpenAI() bool {
	return c.providerName == "openai"
}

type ExtractionContext struct {
	Persona          string
	PreviousCampaign string
}

// SummarizeAndExtract digests crawled raw markdown into a Marketing Knowledge Base format.
func (c *Client) SummarizeAndExtract(ctx context.Context, rawText string, extCtx ExtractionContext) (string, error) {
	if len(rawText) > 12000 {
		rawText = rawText[:12000] // Cap to prevent exceeding model limits
	}

	systemPrompt := fmt.Sprintf(`You are an expert Marketing Intelligence AI. Your job is to "digest" newly crawled webpage content into a structured Research Knowledge Base for a content generation engine.

You must analyze the information from the perspective of this Audience Persona: "%s".
Filter out what this audience cares about the most.

You must also perform a GAP ANALYSIS compared to previous campaigns: "%s".
Identify any NEW findings or angles in this article that were not covered before.

Provide your output as a Markdown block with three sections. 
CRITICAL FORMATTING RULE: You MUST use double line breaks (\n\n) to separate every paragraph and every bullet point. Do not write text bunched together.

### 1. Persona-Focused Summary
(A concise summary of key points most relevant to the Persona. Use short paragraphs with empty lines between them.)

### 2. Gap Analysis
(Bullet points of new concepts, data, or angles not present in previous campaigns. Leave an empty line between each bullet point.)

### 3. Extracted Entities
(Keywords, brand mentions, product categories)`, 
	extCtx.Persona, extCtx.PreviousCampaign)

	log.Printf("[LLM Client] Sending request to model '%s' (provider: %s). Input length: %d chars", c.modelName, c.providerName, len(rawText))

	req := openai.ChatCompletionRequest{
		Model: c.modelName,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: rawText,
			},
		},
		Temperature: 0.3,
	}

	// Retry with exponential backoff for transient errors (503, 429)
	maxRetries := 3
	var resp openai.ChatCompletionResponse
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err = c.client.CreateChatCompletion(ctx, req)
		if err == nil {
			break
		}

		errMsg := err.Error()
		isRetryable := strings.Contains(errMsg, "503") || strings.Contains(errMsg, "429") ||
			strings.Contains(errMsg, "UNAVAILABLE") || strings.Contains(errMsg, "rate")

		if !isRetryable || attempt == maxRetries {
			log.Printf("[LLM Client] ❌ Failed after %d attempt(s). Error: %v", attempt, err)
			return "", fmt.Errorf("failed to process with LLM: %w", err)
		}

		backoff := time.Duration(attempt) * 3 * time.Second
		log.Printf("[LLM Client] ⚠️ Attempt %d/%d failed (retryable). Retrying in %v... Error: %v", attempt, maxRetries, backoff, err)
		time.Sleep(backoff)
	}

	// Log API response metadata
	log.Printf("[LLM Client] ✅ Response received from model '%s'", resp.Model)
	log.Printf("[LLM Client] Token Usage — Prompt: %d | Completion: %d | Total: %d",
		resp.Usage.PromptTokens, resp.Usage.CompletionTokens, resp.Usage.TotalTokens)
	if len(resp.Choices) > 0 {
		log.Printf("[LLM Client] Finish Reason: %s", resp.Choices[0].FinishReason)
	}

	return resp.Choices[0].Message.Content, nil
}

// GenerateEmbedding converts the optimized knowledge base text into a highly dimensional vector
// so it can be stored in Pinecone/pgvector for hybrid RAG querying.
func (c *Client) GenerateEmbedding(ctx context.Context, text string) ([]float32, int, error) {
	if text == "" {
		return nil, 0, fmt.Errorf("empty text provided for embedding")
	}

	// OpenAI recommends text-embedding-3-small as the default high-performance vector model
	req := openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.SmallEmbedding3,
	}

	resp, err := c.client.CreateEmbeddings(ctx, req)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to generate embedding: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, 0, fmt.Errorf("no embedding returned")
	}

	return resp.Data[0].Embedding, resp.Usage.TotalTokens, nil
}

// NewOllamaVisionClient creates a dedicated client for Ollama LLaVA vision model.
func NewOllamaVisionClient(ollamaBaseURL string) *Client {
	if ollamaBaseURL == "" {
		ollamaBaseURL = "http://127.0.0.1:11434/v1"
	}
	return NewClientWithConfig("ollama", ollamaBaseURL, "llava", "ollama")
}

// NewOllamaTextClient creates a dedicated client for Ollama text model (e.g., Qwen 2.5:3B).
func NewOllamaTextClient(ollamaBaseURL, modelName string) *Client {
	if ollamaBaseURL == "" {
		ollamaBaseURL = "http://127.0.0.1:11434/v1"
	}
	if modelName == "" {
		modelName = "qwen2.5:3b"
	}
	return NewClientWithConfig("ollama", ollamaBaseURL, modelName, "ollama")
}

// AnalyzeImage sends an image (as base64) to a vision model (LLaVA) for detailed analysis.
// Returns structured JSON analysis of the image content.
func (c *Client) AnalyzeImage(ctx context.Context, imageBase64 string, mimeType string) (string, error) {
	if imageBase64 == "" {
		return "", fmt.Errorf("empty image data provided for analysis")
	}

	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, imageBase64)

	systemPrompt := `You are an expert Image Analyst AI. Analyze the provided image and return a structured JSON response.

Your analysis must cover:
1. **Description**: A detailed description of the image content (2-3 sentences)
2. **Theme**: The main theme/subject of the image (1-2 words)
3. **Objects**: Key objects, people, or elements visible in the image
4. **Emotions**: The emotional tone or mood conveyed
5. **Colors**: The dominant color palette
6. **Purpose**: The likely intended purpose of this image (marketing, editorial, product showcase, etc.)
7. **Message**: Any message, text overlay, or implied communication
8. **Composition**: Photography/design composition (angle, framing, layout)

Return ONLY valid JSON in this exact format, no markdown fences:
{
  "description": "...",
  "theme": "...",
  "objects": ["...", "..."],
  "emotions": ["...", "..."],
  "colors": ["...", "..."],
  "purpose": "...",
  "message": "...",
  "composition": "..."
}`

	log.Printf("[LLM Client] Analyzing image using model '%s' (provider: %s). Base64 length: %d chars",
		c.modelName, c.providerName, len(imageBase64))

	req := openai.ChatCompletionRequest{
		Model: c.modelName,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role: openai.ChatMessageRoleUser,
				MultiContent: []openai.ChatMessagePart{
					{
						Type: openai.ChatMessagePartTypeText,
						Text: "Analyze this image in detail and return structured JSON as specified.",
					},
					{
						Type: openai.ChatMessagePartTypeImageURL,
						ImageURL: &openai.ChatMessageImageURL{
							URL:    dataURI,
							Detail: openai.ImageURLDetailLow,
						},
					},
				},
			},
		},
		Temperature: 0.3,
	}

	// Retry with exponential backoff
	maxRetries := 3
	var resp openai.ChatCompletionResponse
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err = c.client.CreateChatCompletion(ctx, req)
		if err == nil {
			break
		}

		errMsg := err.Error()
		isRetryable := strings.Contains(errMsg, "503") || strings.Contains(errMsg, "429") ||
			strings.Contains(errMsg, "UNAVAILABLE") || strings.Contains(errMsg, "connection refused")

		if !isRetryable || attempt == maxRetries {
			log.Printf("[LLM Client] ❌ Image analysis failed after %d attempt(s). Error: %v", attempt, err)
			return "", fmt.Errorf("failed to analyze image with LLM: %w", err)
		}

		backoff := time.Duration(attempt) * 5 * time.Second
		log.Printf("[LLM Client] ⚠️ Image analysis attempt %d/%d failed (retryable). Retrying in %v... Error: %v",
			attempt, maxRetries, backoff, err)
		time.Sleep(backoff)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from vision model")
	}

	log.Printf("[LLM Client] ✅ Image analysis response received from model '%s'", resp.Model)
	log.Printf("[LLM Client] Token Usage — Prompt: %d | Completion: %d | Total: %d",
		resp.Usage.PromptTokens, resp.Usage.CompletionTokens, resp.Usage.TotalTokens)

	result := resp.Choices[0].Message.Content
	// Clean potential markdown fences
	result = strings.TrimPrefix(result, "```json")
	result = strings.TrimPrefix(result, "```")
	result = strings.TrimSuffix(result, "```")
	result = strings.TrimSpace(result)

	return result, nil
}

// FormatImageAnalysisAsKnowledge converts structured image analysis JSON into a human-readable
// knowledge text suitable for content generation pipeline.
func FormatImageAnalysisAsKnowledge(analysisJSON string, imageURL string) string {
	var result strings.Builder
	result.WriteString("### Image Analysis Report\n\n")
	result.WriteString(fmt.Sprintf("**Source Image**: %s\n\n", imageURL))
	result.WriteString("**Structured Analysis (JSON)**:\n")
	result.WriteString(analysisJSON)
	result.WriteString("\n\n---\n")
	result.WriteString("This knowledge was extracted from an image using AI vision analysis (LLaVA). ")
	result.WriteString("Use the description, theme, emotions, and message to craft platform-optimized marketing content.\n")
	return result.String()
}

// AutoSuggestResult holds the AI-generated configuration suggestions from Qwen 2.5:3b.
type AutoSuggestResult struct {
	Tone           string   `json:"tone"`
	TargetAudience string   `json:"target_audience"`
	Framework      string   `json:"framework_suggestion"`
	KeyInsights    []string `json:"key_insights"`
	ContentType    string   `json:"content_type"`
	AISuggested    bool     `json:"ai_suggested"`
}

// AutoSuggestFromContent uses Qwen 2.5:3b to analyze crawled content and return
// smart suggestions for tone, audience, framework, and key insights.
// This powers Step 2: AI-Powered Auto-Configuration.
func (c *Client) AutoSuggestFromContent(ctx context.Context, knowledgeText string, language string) (*AutoSuggestResult, error) {
	if knowledgeText == "" {
		return nil, fmt.Errorf("empty knowledge text")
	}

	if len(knowledgeText) > 4000 {
		knowledgeText = knowledgeText[:4000]
	}

	langName := "Vietnamese"
	if language == "en" {
		langName = "English"
	}

	systemPrompt := fmt.Sprintf(`You are an AI content strategist assistant. Analyze the provided text and suggest the best content configuration.

Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "tone": "professional|casual|storyteller|data-driven",
  "target_audience": "A concise description of the ideal target audience",
  "framework_suggestion": "standard|conversational|narrative|aida|pas|analytical",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "content_type": "article|tutorial|review|news|opinion",
  "ai_suggested": true
}

Rules:
- "tone": Choose based on the writing style and subject matter. Technical = professional. Personal story = storyteller. Lots of stats = data-driven.
- "target_audience": Identify WHO would benefit most from this content. 
- "framework_suggestion": "conversational" for relatable/friendly content, "narrative" for stories, AIDA for persuasive/sales content, PAS for problem-solving content, analytical for data-heavy content, standard otherwise.
- "key_insights": Extract 3-5 most important facts, statistics, or unique angles from the text.
- "content_type": Categorize the content type.
- LANGUAGE: You MUST write the "target_audience" and all "key_insights" in %s.
`, langName)

	resp, err := c.callWithRetry(ctx, systemPrompt, knowledgeText, 0.3)
	if err != nil {
		return nil, fmt.Errorf("auto-suggest LLM call failed: %w", err)
	}

	resultJSON := resp.Choices[0].Message.Content
	// Clean potential markdown fences
	resultJSON = strings.TrimPrefix(resultJSON, "```json")
	resultJSON = strings.TrimPrefix(resultJSON, "```")
	resultJSON = strings.TrimSuffix(resultJSON, "```")
	resultJSON = strings.TrimSpace(resultJSON)

	var result AutoSuggestResult
	if err := parseJSON(resultJSON, &result); err != nil {
		log.Printf("[LLM Client] ⚠️ Failed to parse auto-suggest JSON: %v. Raw: %s", err, resultJSON[:min(len(resultJSON), 200)])
		// Return defaults with whatever we can extract
		return &AutoSuggestResult{
			Tone:           "professional",
			Framework:      "standard",
			KeyInsights:    []string{},
			ContentType:    "article",
			AISuggested:    false,
		}, nil
	}

	result.AISuggested = true
	return &result, nil
}

// ContentBrief holds user-provided parameters for content generation.
type ContentBrief struct {
	Platform               string // "facebook", "linkedin", "blog"
	Tone                   string // "professional", "casual", "storyteller", "data-driven"
	TargetAudience         string
	ContentLength          string // "short", "medium", "long"
	AdditionalInstructions string
	Language               string // "vi", "en"
	// Brand DNA — Context Injection
	BrandName       string
	BrandPersona    string // e.g. "Expert công nghệ, giọng tự tin, dẫn dắt bằng data"
	BrandGuidelines string // Brand voice guidelines
	// Outline (passed from Step 1 → Step 2)
	Outline string // JSON outline from GenerateMasterOutline
	// User-provided image URL — injected as visual anchor in generated content
	ImageURL     string // Direct URL to user-uploaded or referenced image
	ImageEmotion string // Emotional metadata from Vision analysis (e.g., "inspiring, warm")
	ImageContext string // Contextual description from Vision analysis
}

// OutlineResult holds the generated master outline.
type OutlineResult struct {
	OutlineJSON string `json:"outline_json"` // Structured JSON outline
	OutlineText string `json:"outline_text"` // Human-readable outline text
	ModelUsed   string `json:"model_used"`
	TokenUsage  struct {
		Prompt     int `json:"prompt"`
		Completion int `json:"completion"`
		Total      int `json:"total"`
	} `json:"token_usage"`
}

// ContentResult holds the generated content and metadata.
type ContentResult struct {
	ContentHTML string `json:"content_html"`
	ContentText string `json:"content_text"`
	ModelUsed   string `json:"model_used"`
	TokenUsage  struct {
		Prompt     int `json:"prompt"`
		Completion int `json:"completion"`
		Total      int `json:"total"`
	} `json:"token_usage"`
}

// GenerateMasterOutline creates a structured content outline with Brand DNA context injection.
// This is Step 3+4 of the pipeline: Context Injection → Master Outline.
func (c *Client) GenerateMasterOutline(ctx context.Context, knowledgeText string, brief ContentBrief) (*OutlineResult, error) {
	if knowledgeText == "" {
		return nil, fmt.Errorf("empty knowledge text provided")
	}

	if len(knowledgeText) > 15000 {
		knowledgeText = knowledgeText[:15000]
	}

	lang := "Vietnamese"
	if brief.Language == "en" {
		lang = "English"
	}

	// Build Brand DNA context injection
	brandContext := ""
	if brief.BrandName != "" || brief.BrandPersona != "" || brief.BrandGuidelines != "" {
		brandContext = fmt.Sprintf(`
=== BRAND DNA (Context Injection) ===
- Brand Name: %s
- Brand Persona: %s
- Brand Voice Guidelines: %s
You MUST infuse every section of the outline with this brand identity.`, 
			defaultStr(brief.BrandName, "Not specified"),
			defaultStr(brief.BrandPersona, "Expert professional"),
			defaultStr(brief.BrandGuidelines, "Clear, credible, audience-first"))
	}

	platformGuide := getPlatformGuide(brief.Platform)
	toneGuide := getToneGuide(brief.Tone)

	systemPrompt := fmt.Sprintf(`Bạn là một Chuyên gia Chiến lược Nội dung Cao cấp. Nhiệm vụ của bạn là lập một **Dàn ý Nội dung Master** từ dữ liệu nghiên cứu.
%s

=== NHIỆM VỤ CỦA BẠN ===
1. Phân tích dữ liệu nghiên cứu được cung cấp.
2. Tiêm DNA Thương hiệu để căn chỉnh các insight phù hợp với bản sắc thương hiệu.
3. Tạo dàn ý có cấu trúc linh hoạt dựa trên sự chuyển đổi tự nhiên của ý tưởng:
   - Thay vì bám sát cứng nhắc vào framework, hãy ưu tiên sự kết nối giữa các phần.
   - Các framework như AIDA hoặc PAS chỉ dùng làm kim chỉ nam cho luồng logic, không nhất thiết phải xuất hiện tên các phần này trong bài viết.
   - Khuyến khích sử dụng các cấu trúc như: Kể chuyện (Storytelling), Câu hỏi & Giải pháp, hoặc Chia sẻ kinh nghiệm thực tế.
4. Mỗi phần phải có mục đích rõ ràng và các điểm thảo luận chính.

=== NỀN TẢNG ===
%s

=== TÔNG GIỌNG ===
%s

=== YÊU CẦU ===
- Đối tượng mục tiêu: %s
- Ngôn ngữ: Bạn BẮT BUỘC phải viết toàn bộ dàn ý bằng %s.
- Hướng dẫn bổ sung: %s

=== ĐỊNH DẠNG ĐẦU RA ===
Trả về một JSON object với cấu trúc chính xác như sau:
{
  "framework": "Narrative|Conversational|AIDA|PAS|Question-Solution",
  "title_suggestion": "Tiêu đề gợi ý cho nội dung",
  "sections": [
    {
      "id": "1",
      "heading": "Tiêu đề phần",
      "purpose": "Tại sao phần này tồn tại (VD: 'Thu hút người đọc')",
      "key_points": ["Điểm 1", "Điểm 2"],
      "suggested_length": "short|medium|long",
      "data_to_include": "Dữ liệu/thống kê cụ thể từ nghiên cứu để sử dụng ở đây"
    }
  ],
  "cta": "Lời kêu gọi hành động gợi ý",
  "hashtags": ["#tag1", "#tag2"]
}

CHỈ trả về JSON. Không có markdown, không giải thích.`,
		brandContext, platformGuide, toneGuide,
		defaultStr(brief.TargetAudience, "General audience"),
		lang,
		defaultStr(brief.AdditionalInstructions, "None"))

	userPrompt := fmt.Sprintf("Create a master outline from this research knowledge:\n\n%s", knowledgeText)

	log.Printf("[LLM Client] Generating Master Outline (%s, %s, %s)...", brief.Platform, brief.Tone, lang)

	resp, err := c.callWithRetry(ctx, systemPrompt, userPrompt, 0.5)
	if err != nil {
		return nil, err
	}

	log.Printf("[LLM Client] ✅ Outline generated. Model: %s, Tokens: %d", resp.Model, resp.Usage.TotalTokens)

	outlineJSON := resp.Choices[0].Message.Content
	// Clean potential markdown fences
	outlineJSON = strings.TrimPrefix(outlineJSON, "```json")
	outlineJSON = strings.TrimPrefix(outlineJSON, "```")
	outlineJSON = strings.TrimSuffix(outlineJSON, "```")
	outlineJSON = strings.TrimSpace(outlineJSON)

	result := &OutlineResult{
		OutlineJSON: outlineJSON,
		OutlineText: stripHTMLTags(outlineJSON), // fallback readable form
		ModelUsed:   resp.Model,
	}
	result.TokenUsage.Prompt = resp.Usage.PromptTokens
	result.TokenUsage.Completion = resp.Usage.CompletionTokens
	result.TokenUsage.Total = resp.Usage.TotalTokens

	return result, nil
}

// GenerateMarketingContent creates platform-optimized marketing content.
// Uses Context Window Master with multi-layer prompt architecture:
// Layer 1 (Base): Brand DNA · Layer 2 (Info): Web Scraper insights
// Layer 3 (Emotion): Image/Vision metadata · Layer 4 (Structure): Copywriting Framework
// If brief.Outline is provided (from GenerateMasterOutline), content follows the approved structure.
func (c *Client) GenerateMarketingContent(ctx context.Context, knowledgeText string, brief ContentBrief) (*ContentResult, error) {
	if knowledgeText == "" {
		return nil, fmt.Errorf("empty knowledge text provided")
	}

	if len(knowledgeText) > 15000 {
		knowledgeText = knowledgeText[:15000]
	}

	wordTarget := "500-700"
	switch brief.ContentLength {
	case "short":
		wordTarget = "150-250"
	case "medium":
		wordTarget = "400-600"
	case "long":
		wordTarget = "800-1200"
	}

	lang := "Vietnamese"
	if brief.Language == "en" {
		lang = "English"
	}

	platformGuide := getPlatformGuide(brief.Platform)
	toneGuide := getToneGuide(brief.Tone)

	// ═══════════════════════════════════════════════════════
	// CONTEXT WINDOW MASTER — Multi-Layer Prompt Architecture
	// ═══════════════════════════════════════════════════════

	// LAYER 1 (Base): Brand DNA — ensures brand consistency
	brandLayer := ""
	if brief.BrandName != "" || brief.BrandPersona != "" {
		brandLayer = fmt.Sprintf(`
[BRAND CONTEXT]: Sử dụng giọng văn %s cho đối tượng %s.
- Brand: %s
- Persona: %s
- Guidelines: %s
Infuse the brand identity naturally throughout the content.`,
			defaultStr(brief.Tone, "professional"),
			defaultStr(brief.TargetAudience, "General audience"),
			defaultStr(brief.BrandName, ""),
			defaultStr(brief.BrandPersona, "Expert professional"),
			defaultStr(brief.BrandGuidelines, ""))
	}

	// LAYER 3 (Emotion): Image/Vision metadata — visual anchor for hooks
	visualLayer := ""
	imageInstruction := ""
	if brief.ImageURL != "" {
		visualLayer = fmt.Sprintf(`
[VISUAL ANCHOR]: Người dùng đã cung cấp một hình ảnh tham chiếu.
Cảm xúc hình ảnh: %s. Ngữ cảnh hình ảnh: %s.
- Sử dụng siêu dữ liệu cảm xúc và ngữ cảnh từ hình ảnh này để tạo ra một đoạn Hook mở đầu đầy hấp dẫn.`,
			defaultStr(brief.ImageEmotion, "thu hút, chuyên nghiệp"),
			defaultStr(brief.ImageContext, "nội dung hình ảnh minh họa cho bài viết"))
		
		imageInstruction = "- TUYỆT ĐỐI KHÔNG tự tạo bất kỳ thẻ <img> hay markdown ![...](...) nào trong nội dung bài viết. Hệ thống của tôi sẽ tự động thực hiện việc chèn ảnh vào vị trí phù hợp sau."
	} else {
		imageInstruction = `- QUAN TRỌNG: Bạn PHẢI tự chèn 1-2 hình ảnh liên quan để minh họa nội dung (không dùng gạch ngang). Dùng URL với định dạng HTML sau: <img src="https://image.pollinations.ai/prompt/{mô_tả_ảnh_bằng_tiếng_anh_viết_liền_bằng_dấu_cộng}?width=800&height=400&nologo=true" alt="{mô_tả}" style="border-radius: 8px; margin: 16px 0; width: 100%%;" />`
	}

	// LAYER 4 (Structure): Copywriting Framework — outline-driven structure
	outlineSection := ""
	if brief.Outline != "" {
		outlineSection = fmt.Sprintf(`
[STRUCTURE]: Triển khai bài viết theo khung %s với độ dài %s.
Your content MUST follow the structural sequence below. Treat each Level 1 item as a major section (H2) and Level 2 items as sub-topics (H3). 
If the outline is provided in JSON format, parse it and use its hierarchy as your skeleton.
DO NOT skip any sections specified here.

FRAMEWORK DATA:
%s`, getCopywritingFrameworkLabel(brief.Outline), wordTarget, brief.Outline)
	}

	// Build system prompt with Context Window Master
	systemPrompt := fmt.Sprintf(`Bạn là một chuyên gia Content Marketing cao cấp. Nhiệm vụ của bạn là tạo ra một bài viết thực tế, không ảo tưởng, dựa trên các lớp dữ liệu cung cấp dưới đây.
%s
%s
%s

=== YÊU CẦU VẬN HÀNH ===
1. HƯỚNG DẪN NỀN TẢNG: %s
2. TÔNG GIỌNG & PHONG CÁCH: %s
3. ĐỐI TƯỢNG MỤC TIÊU: %s
4. SEO & ĐỘ DÀI: Mục tiêu khoảng %s từ.
5. NGÔN NGỮ: Bạn BẮT BUỘC phải viết toàn bộ nội dung bài viết bằng %s. Không sử dụng bất kỳ ngôn ngữ nào khác.

=== TIÊU CHUẨN COPYWRITING CHUYÊN NGHIỆP (BẮT BUỘC) ===
- RULE OF ONE: Mỗi bài viết nên tập trung vào MỘT thông điệp cốt lõi hoặc một giải pháp duy nhất để tránh làm loãng sự chú ý.
- BENEFIT OVER FEATURE: Đừng chỉ liệt kê tính năng (VD: RAM 16GB). Hãy bán "Lợi ích" (VD: Chạy mượt mà mọi ứng dụng nặng nhất mà không giật lag).
- SHOW, DON'T TELL: Thay vì nói "Sản phẩm của chúng tôi rất nhanh", hãy đưa ra số liệu hoặc ví dụ cụ thể (VD: "Xử lý 1000 dữ liệu chỉ trong 2 giây").
- STRONG HOOK: Mở đầu bằng một câu hỏi nhức nhối, một con số gây sốc hoặc một lời khẳng định phá vỡ định kiến để giữ chân người đọc ngay từ 3 giây đầu.
- NHỊP ĐIỆU VĂN BẢN: Câu văn phải có sự thay đổi về độ dài để tạo sự lôi cuốn, tránh viết các câu dài liên tiếp gây mệt mỏi.
- NGÔN NGỮ CHUYÊN GIA: Nói tiếng nói của ngành nhưng vẫn đủ dễ hiểu để thu phục đối tượng khách hàng mục tiêu. Tránh các từ sáo rỗng như "đột phá", "vượt trội", "đẳng cấp" mà không có dẫn chứng.
- HÀNH VĂN TỰ NHIÊN (RẤT QUAN TRỌNG): Tránh việc chia bài viết quá rập khuôn theo framework (như ghi rõ chữ Attention, Interest...). Hãy sử dụng các đoạn chuyển tiếp mượt mà như đang nói chuyện trực tiếp với độc giả. Viết sao cho người đọc cảm thấy đây là chia sẻ từ một con người thực thụ, không phải từ một cỗ máy quảng cáo.
- GẦN GŨI & THỰC TẾ: Sử dụng các ví dụ đời thường, ngôn ngữ đời sống để giải thích các vấn đề phức tạp. Tránh lối viết lý thuyết, giáo điều.

=== ĐỊNH DẠNG ĐẦU RA NGHIÊM NGẶT (RẤT QUAN TRỌNG) ===
- BẮT BUỘC CHỈ sử dụng HTML tags. TUYỆT ĐỐI KHÔNG dùng ký hiệu Markdown (#, **, [link], -, *).
- MỖI ĐOẠN VĂN phải được bọc trong thẻ <p>...</p>. 
- GIỮA CÁC ĐOẠN VĂN (giữa các thẻ </p> và <p>) phải có ít nhất 1 dòng trống (\n\n) để tạo không gian thở.
- Nội dung phải được trình bày sạch sẽ như một bài báo chuyên nghiệp trên blog.
- Trả về mã HTML thuần (RAW HTML). TUYỆT ĐỐI KHÔNG được thực thể hóa (escape) các thẻ HTML (VD: không dùng &lt;, &gt;, &quot;). Thẻ HTML phải được render trực tiếp.
- TUYỆT ĐỐI KHÔNG viết dính liền thành một khối văn bản.
- TUYỆT ĐỐI KHÔNG sử dụng gạch ngang (strikethrough) hoặc các thẻ <s>, <strike>, <del> trong bất kỳ trường hợp nào.
- TUYỆT ĐỐI KHÔNG sử dụng ký tự gạch chéo ngược (backslash \ ) làm dấu ngăn cách hay xuống dòng.
- ĐẢM BẢO nội dung được bọc hoàn toàn trong các thẻ HTML hợp lệ.

[YÊU CẦU CỤ THỂ]: %s
[VÍ DỤ SAI]: **Headline** \n Dữ liệu dính liền...
[VÍ DỤ ĐÚNG]: <h2>Headline</h2> \n <p>Đoạn văn thứ nhất.</p> \n \n <p>Đoạn văn thứ hai.</p>`,
		brandLayer, visualLayer, outlineSection, platformGuide, toneGuide, 
		defaultStr(brief.TargetAudience, "General audience"),
		wordTarget, lang, imageInstruction,
		defaultStr(brief.AdditionalInstructions, "None"))

	// LAYER 2 (Info): Research Data — the core content source
	userPrompt := fmt.Sprintf("[RESEARCH DATA]: Các sự thật/dữ liệu quan trọng từ nguồn nghiên cứu:\n\n%s", knowledgeText)

	log.Printf("[LLM Client] Generating %s content (%s tone, ~%s words, %s, outline: %v, image: %v)...",
		brief.Platform, brief.Tone, wordTarget, lang, brief.Outline != "", brief.ImageURL != "")

	resp, err := c.callWithRetry(ctx, systemPrompt, userPrompt, 0.7)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	log.Printf("[LLM Client] ✅ Content generated. Model: %s, Tokens: %d", resp.Model, resp.Usage.TotalTokens)

	contentHTML := resp.Choices[0].Message.Content

	// ═══════════════════════════════════════════════════
	// POST-PROCESSING: Deterministic Image Injection
	// ═══════════════════════════════════════════════════
	if brief.ImageURL != "" {
		safeURL := strings.ReplaceAll(brief.ImageURL, `"`, `%22`)
		safeContext := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(defaultStr(brief.ImageContext, "Hình ảnh minh họa"), `"`, `&quot;`), `<`, `&lt;`), `>`, `&gt;`)
		
		imgTag := fmt.Sprintf(`<figure style="margin: 24px 0; text-align: center;"><img src="%s" alt="%s" style="border-radius: 12px; width: 100%%; max-width: 720px; box-shadow: 0 8px 25px -5px rgb(0 0 0 / 0.15); display: inline-block;" /><figcaption style="font-size: 13px; color: #888; margin-top: 8px; font-style: italic;">%s</figcaption></figure>`,
			safeURL,
			safeContext,
			safeContext)

		// Strategy: Insert after the first </h1> if exists, otherwise after first </p>
		injected := false
		for _, marker := range []string{"</h1>", "</h2>", "</p>"} {
			idx := strings.Index(contentHTML, marker)
			if idx >= 0 {
				insertPos := idx + len(marker)
				contentHTML = contentHTML[:insertPos] + "\n" + imgTag + "\n" + contentHTML[insertPos:]
				injected = true
				log.Printf("[LLM Client] 🖼️ Image injected after %s at position %d", marker, insertPos)
				break
			}
		}
		// Fallback: prepend if no suitable marker found
		if !injected {
			contentHTML = imgTag + "\n" + contentHTML
			log.Printf("[LLM Client] 🖼️ Image prepended (no HTML marker found)")
		}
	}

	// ═══════════════════════════════════════════════════
	// POST-PROCESSING: Fix common AI formatting errors
	// ═══════════════════════════════════════════════════
	
	// 1. Clean ALL strike-through tags (s, strike, del) - case insensitive, handles attributes
	strikeRegex := regexp.MustCompile(`(?i)<(s|strike|del|strikethrough)[^>]*>|</(s|strike|del|strikethrough)>`)
	contentHTML = strikeRegex.ReplaceAllString(contentHTML, "")
	
	// 2. Remove markdown strikethrough (~~)
	contentHTML = strings.ReplaceAll(contentHTML, "~~", "")
	
	// 3. Convert any leaked Markdown bold (**text**) to HTML strong (<strong>text</strong>)
	boldRegex := regexp.MustCompile(`\*\*(.*?)\*\*`)
	contentHTML = boldRegex.ReplaceAllString(contentHTML, "<strong>$1</strong>")
	
	// 4. Convert any leaked Markdown italic (*text*) to HTML em (<em>text</em>)
	italicRegex := regexp.MustCompile(`\*([^*]+)\*`)
	contentHTML = italicRegex.ReplaceAllString(contentHTML, "<em>$1</em>")

	// 5. Clean stray backslashes (often appearing as escaped newlines or separators)
	contentHTML = strings.ReplaceAll(contentHTML, " \\ ", " ")
	contentHTML = strings.ReplaceAll(contentHTML, "\\\n", "\n")
	contentHTML = strings.ReplaceAll(contentHTML, "\\ ", " ")

	// 6. Clean stray backticks (sometimes models wrap HTML in code blocks)
	contentHTML = strings.ReplaceAll(contentHTML, "```html", "")
	contentHTML = strings.ReplaceAll(contentHTML, "```", "")

	// 7. Fix common spacing issues for the editor
	contentHTML = strings.ReplaceAll(contentHTML, "</p><p>", "</p>\n\n<p>")
	contentHTML = strings.ReplaceAll(contentHTML, "</h2><p>", "</h2>\n\n<p>")
	contentHTML = strings.ReplaceAll(contentHTML, "</h3><p>", "</h3>\n\n<p>")
	contentHTML = strings.ReplaceAll(contentHTML, "</h1><p>", "</h1>\n\n<p>")
	
	// 8. Prevent mangled markdown image + HTML injection artifacts
	contentHTML = strings.ReplaceAll(contentHTML, "!<figure", "<figure")
	contentHTML = strings.ReplaceAll(contentHTML, "!<img", "<img")

	// 8. Scrub non-printable characters (common 'tofu' sources in LLM outputs)
	sb := strings.Builder{}
	for _, r := range contentHTML {
		if unicode.IsPrint(r) || r == '\n' || r == '\r' || r == '\t' {
			sb.WriteRune(r)
		}
	}
	contentHTML = sb.String()

	// 9. Remove any trailing or leading whitespace/newlines
	contentHTML = strings.TrimSpace(contentHTML)

	result := &ContentResult{
		ContentHTML: contentHTML,
		ModelUsed:   resp.Model,
	}
	result.TokenUsage.Prompt = resp.Usage.PromptTokens
	result.TokenUsage.Completion = resp.Usage.CompletionTokens
	result.TokenUsage.Total = resp.Usage.TotalTokens

	result.ContentText = stripHTMLTags(result.ContentHTML)

	return result, nil
}

// callWithRetry makes an LLM API call with exponential backoff for transient errors.
func (c *Client) callWithRetry(ctx context.Context, systemPrompt, userPrompt string, temperature float32) (openai.ChatCompletionResponse, error) {
	req := openai.ChatCompletionRequest{
		Model: c.modelName,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userPrompt},
		},
		Temperature: temperature,
	}

	maxRetries := 3
	var resp openai.ChatCompletionResponse
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err = c.client.CreateChatCompletion(ctx, req)
		if err == nil {
			return resp, nil
		}
		errMsg := err.Error()
		isRetryable := strings.Contains(errMsg, "503") || strings.Contains(errMsg, "429") ||
			strings.Contains(errMsg, "UNAVAILABLE") || strings.Contains(errMsg, "rate")
		if !isRetryable || attempt == maxRetries {
			log.Printf("[LLM Client] ❌ Failed after %d attempt(s). Error: %v", attempt, err)
			return resp, err
		}
		backoff := time.Duration(attempt) * 3 * time.Second
		log.Printf("[LLM Client] ⚠️ Attempt %d/%d failed (retryable). Retrying in %v...", attempt, maxRetries, backoff)
		time.Sleep(backoff)
	}
	return resp, err
}

func defaultStr(val, fallback string) string {
	if strings.TrimSpace(val) == "" {
		return fallback
	}
	return val
}

func getPlatformGuide(platform string) string {
	switch platform {
	case "facebook":
		return `- Hook the reader in the first 2 lines (they decide whether to "See more")
- Use emojis strategically (1-2 per section, not excessive)
- Include a clear CTA (call to action) at the end
- Add relevant hashtags (3-5) at the very end
- Use short paragraphs (2-3 sentences max)
- Bullet points and lists work great for scannability`
	case "linkedin":
		return `- Lead with a bold, thought-provoking statement or statistic
- Write in a professional but conversational tone
- Use line breaks between paragraphs for readability
- Include data points and statistics where possible
- End with a question to encourage engagement
- Structure: Hook → Context → Insight → Framework → CTA`
	case "blog":
		return `- Sử dụng tiêu đề H1 mạnh mẽ, thu hút sự chú ý.
- Chia nội dung thành các phần rõ ràng bằng thẻ H2 và H3.
- Sử dụng danh sách có dấu đầu dòng (ul/li) để liệt kê các lợi ích hoặc bước thực hiện.
- Sử dụng thẻ <blockquote> cho các trích dẫn quan trọng hoặc lời chứng thực.
- Kết thúc bằng một phần kết luận súc tích và CTA rõ ràng.
- SEO-friendly: Chèn từ khóa một cách tự nhiên vào các tiêu đề và nội dung.`
	default:
		return "Write clear, engaging content appropriate for the platform."
	}
}

func getToneGuide(tone string) string {
	switch tone {
	case "casual":
		return "Viết như đang trò chuyện thân mật với một người bạn. Sử dụng ngôn ngữ đời thường, gần gũi, pha chút hóm hỉnh nếu phù hợp. Tránh dùng thuật ngữ chuyên môn khó hiểu. Hãy tạo cảm giác chân thực và dễ kết nối."
	case "storyteller":
		return "Sử dụng kỹ thuật kể chuyện: đưa vào các tình huống thực tế, mô tả sống động và đánh vào cảm xúc. Dẫn dắt người đọc qua một hành trình trải nghiệm. Biến các dữ liệu khô khan thành những câu chuyện có hồn."
	case "data-driven":
		return "Dẫn dắt bài viết bằng con số, số liệu thống kê và bằng chứng thực tế. Ngôn ngữ chính xác, khách quan nhưng vẫn phải dễ hiểu. Tập trung vào các kết quả có thể đo lường được để tạo sự tin tưởng tuyệt đối."
	default: // "professional"
		return "Viết với phong thái của một chuyên gia nhưng vẫn giữ được sự tinh tế và gần gũi. Ngôn ngữ chuyên nghiệp, rõ ràng, súc tích và có chiều sâu. Tránh lối viết quá trang trọng một cách máy móc; thay vào đó, hãy dùng sự thấu hiểu để chia sẻ kiến thức."
	}
}

func stripHTMLTags(s string) string {
	var result strings.Builder
	inTag := false
	inQuote := false
	for _, r := range s {
		if r == '"' {
			if inTag {
				inQuote = !inQuote
			}
		}
		if r == '<' && !inQuote {
			inTag = true
			continue
		}
		if r == '>' && !inQuote {
			inTag = false
			result.WriteRune(' ')
			continue
		}
		if !inTag {
			result.WriteRune(r)
		}
	}
	return strings.TrimSpace(result.String())
}

// parseJSON is a safe JSON parser helper.
func parseJSON(raw string, v interface{}) error {
	return json.Unmarshal([]byte(raw), v)
}

// getCopywritingFrameworkLabel extracts framework type from outline JSON.
func getCopywritingFrameworkLabel(outlineJSON string) string {
	type frameworkDetect struct {
		Framework string `json:"framework"`
	}
	var fd frameworkDetect
	if err := json.Unmarshal([]byte(outlineJSON), &fd); err == nil && fd.Framework != "" {
		return fd.Framework
	}
	return "Standard"
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
