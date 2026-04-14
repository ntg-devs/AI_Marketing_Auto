package llm

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

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

Provide your output as a Markdown block with three sections:
### 1. Persona-Focused Summary
(A concise summary of key points most relevant to the Persona)

### 2. Gap Analysis
(Bullet points of new concepts, data, or angles not present in previous campaigns)

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

	systemPrompt := fmt.Sprintf(`You are a Senior Content Strategist AI. Your role is to create a **Master Content Outline** from research data.
%s

=== YOUR TASK ===
1. Analyze the research knowledge provided
2. Inject the Brand DNA to align insights with brand identity
3. Create a structured outline using the appropriate framework:
   - For Blog/LinkedIn: Use AIDA (Attention → Interest → Desire → Action) or PAS (Problem → Agitate → Solve)
   - For Facebook: Use Hook → Story → Offer → CTA
4. Each section should have a clear purpose and key talking points

=== PLATFORM ===
%s

=== TONE ===
%s

=== REQUIREMENTS ===
- Target audience: %s
- Language: %s
- Additional context: %s

=== OUTPUT FORMAT ===
Return a JSON object with this exact structure:
{
  "framework": "AIDA|PAS|Hook-Story-Offer",
  "title_suggestion": "Suggested headline for the content",
  "sections": [
    {
      "id": "1",
      "heading": "Section heading",
      "purpose": "Why this section exists (e.g., 'Hook the reader')",
      "key_points": ["Point 1", "Point 2"],
      "suggested_length": "short|medium|long",
      "data_to_include": "Specific data/stats from research to use here"
    }
  ],
  "cta": "Suggested call-to-action",
  "hashtags": ["#tag1", "#tag2"]
}

Return ONLY the JSON. No markdown fences, no explanation.`,
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

	// Brand DNA context
	brandSection := ""
	if brief.BrandName != "" || brief.BrandPersona != "" {
		brandSection = fmt.Sprintf(`
=== BRAND IDENTITY ===
- Brand: %s
- Persona: %s
- Guidelines: %s
Infuse the brand identity naturally throughout the content.`,
			defaultStr(brief.BrandName, ""),
			defaultStr(brief.BrandPersona, "Expert professional"),
			defaultStr(brief.BrandGuidelines, ""))
	}

	// Outline section
	outlineSection := ""
	if brief.Outline != "" {
		outlineSection = fmt.Sprintf(`
=== APPROVED OUTLINE (MUST FOLLOW) ===
You MUST follow this approved content structure exactly. Write the full content for each section:
%s`, brief.Outline)
	}

	systemPrompt := fmt.Sprintf(`You are an expert Marketing Content Creator AI. Craft compelling, publish-ready content for the "%s" platform.
%s
=== PLATFORM GUIDELINES ===
%s

=== TONE & VOICE ===
%s
%s
=== REQUIREMENTS ===
- Target audience: %s
- Word count target: %s words
- Language: %s
- Output format: Return ONLY valid HTML tags (h1, h2, h3, p, ul, ol, li, strong, em, blockquote). No markdown. No wrapper div.
- Do NOT include any explanation, commentary, or meta-text. Only the content itself.

=== ADDITIONAL INSTRUCTIONS ===
%s`,
		brief.Platform, brandSection, platformGuide, toneGuide, outlineSection,
		brief.TargetAudience, wordTarget, lang,
		defaultStr(brief.AdditionalInstructions, "None"))

	userPrompt := fmt.Sprintf("Based on the following research knowledge, create the content:\n\n%s", knowledgeText)

	log.Printf("[LLM Client] Generating %s content (%s tone, ~%s words, %s, outline: %v)...",
		brief.Platform, brief.Tone, wordTarget, lang, brief.Outline != "")

	resp, err := c.callWithRetry(ctx, systemPrompt, userPrompt, 0.7)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	log.Printf("[LLM Client] ✅ Content generated. Model: %s, Tokens: %d", resp.Model, resp.Usage.TotalTokens)

	result := &ContentResult{
		ContentHTML: resp.Choices[0].Message.Content,
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
		return `- Start with a compelling H1 title
- Use H2 and H3 subheadings to structure the article
- Include an introduction that sets context
- Use bullet points, numbered lists for key takeaways
- Include blockquotes for emphasis or citations
- End with a conclusion and next steps
- SEO-friendly: naturally include keywords in headings`
	default:
		return "Write clear, engaging content appropriate for the platform."
	}
}

func getToneGuide(tone string) string {
	switch tone {
	case "casual":
		return "Write like you're talking to a friend. Use contractions, casual language, humor where appropriate. Be relatable and approachable."
	case "storyteller":
		return "Use narrative techniques: anecdotes, vivid descriptions, emotional hooks. Take the reader on a journey. Paint pictures with words."
	case "data-driven":
		return "Lead with numbers, statistics, and evidence. Use precise language. Include percentages, comparisons, and measurable outcomes. Be authoritative."
	default: // "professional"
		return "Write with authority and expertise. Be clear, concise, and credible. Use industry terminology appropriately. Maintain a polished, trustworthy voice."
	}
}

func stripHTMLTags(s string) string {
	var result strings.Builder
	inTag := false
	for _, r := range s {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
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
