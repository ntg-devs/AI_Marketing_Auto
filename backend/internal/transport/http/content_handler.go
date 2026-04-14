package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/llm"
	"bityagi/pkg/response"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
)

type contentHandler struct {
	aiRepo    domain.AIProviderRepository
	crawlRepo domain.CrawlRepository
}

func NewContentHandler(aiRepo domain.AIProviderRepository, crawlRepo domain.CrawlRepository) *contentHandler {
	return &contentHandler{aiRepo: aiRepo, crawlRepo: crawlRepo}
}

func (h *contentHandler) GenerateContent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TeamID                 string `json:"team_id"`
		KnowledgeSourceID      string `json:"knowledge_source_id"`
		KnowledgeText          string `json:"knowledge_text"`
		Platform               string `json:"platform"`
		Tone                   string `json:"tone"`
		TargetAudience         string `json:"target_audience"`
		ContentLength          string `json:"content_length"`
		AdditionalInstructions string `json:"additional_instructions"`
		Language               string `json:"language"`
		BrandName              string `json:"brand_name"`
		BrandPersona           string `json:"brand_persona"`
		BrandGuidelines        string `json:"brand_guidelines"`
		Outline                string `json:"outline"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.TeamID == "" {
		response.Error(w, http.StatusBadRequest, "team_id is required")
		return
	}
	if req.KnowledgeText == "" && req.KnowledgeSourceID == "" {
		response.Error(w, http.StatusBadRequest, "knowledge_text or knowledge_source_id is required")
		return
	}
	if req.Platform == "" {
		req.Platform = "blog"
	}
	if req.Tone == "" {
		req.Tone = "professional"
	}
	if req.ContentLength == "" {
		req.ContentLength = "medium"
	}
	if req.Language == "" {
		req.Language = "vi"
	}
	if req.TargetAudience == "" {
		req.TargetAudience = "Người quan tâm đến công nghệ và marketing"
	}

	// If knowledge_source_id is provided, try to load the content from DB
	knowledgeText := req.KnowledgeText
	if knowledgeText == "" && req.KnowledgeSourceID != "" {
		ksID, err := uuid.Parse(req.KnowledgeSourceID)
		if err == nil {
			ks, err := h.crawlRepo.GetKnowledgeSourceByID(r.Context(), ksID)
			if err == nil && ks != nil {
				knowledgeText = ks.ContentText
				log.Printf("[Content Handler] Loaded knowledge source %s (%d chars)", ksID, len(knowledgeText))
			}
		}
	}

	if knowledgeText == "" {
		response.Error(w, http.StatusBadRequest, "no knowledge content available for generation")
		return
	}

	// Get AI provider config
	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team_id")
		return
	}

	config, err := h.aiRepo.GetDefaultConfig(r.Context(), teamID)
	if err != nil || config == nil || config.APIKey == "" {
		response.Error(w, http.StatusBadRequest, "No AI provider configured. Please set up your API key in AI Engine Configuration.")
		return
	}

	log.Printf("[Content Handler] Generating %s content using %s/%s for team %s",
		req.Platform, config.ProviderName, config.ModelName, req.TeamID)

	// Create LLM client and generate content
	aiClient := llm.NewClientWithConfig(config.APIKey, config.BaseURL, config.ModelName, config.ProviderName)

	brief := llm.ContentBrief{
		Platform:               req.Platform,
		Tone:                   req.Tone,
		TargetAudience:         req.TargetAudience,
		ContentLength:          req.ContentLength,
		AdditionalInstructions: req.AdditionalInstructions,
		Language:               req.Language,
		BrandName:              req.BrandName,
		BrandPersona:           req.BrandPersona,
		BrandGuidelines:        req.BrandGuidelines,
		Outline:                req.Outline,
	}

	result, err := aiClient.GenerateMarketingContent(r.Context(), knowledgeText, brief)
	if err != nil {
		log.Printf("[Content Handler] ❌ Content generation failed: %v", err)
		response.Error(w, http.StatusInternalServerError, "Content generation failed: "+err.Error())
		return
	}

	log.Printf("[Content Handler] ✅ Content generated successfully. %d chars HTML, %d total tokens",
		len(result.ContentHTML), result.TokenUsage.Total)

	response.JSON(w, http.StatusOK, result, "Content generated successfully")
}

// GenerateOutline handles Step 3+4: Context Injection → Master Outline
func (h *contentHandler) GenerateOutline(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TeamID                 string `json:"team_id"`
		KnowledgeSourceID      string `json:"knowledge_source_id"`
		KnowledgeText          string `json:"knowledge_text"`
		Platform               string `json:"platform"`
		Tone                   string `json:"tone"`
		TargetAudience         string `json:"target_audience"`
		AdditionalInstructions string `json:"additional_instructions"`
		Language               string `json:"language"`
		BrandName              string `json:"brand_name"`
		BrandPersona           string `json:"brand_persona"`
		BrandGuidelines        string `json:"brand_guidelines"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TeamID == "" {
		response.Error(w, http.StatusBadRequest, "team_id is required")
		return
	}

	// Load knowledge text
	knowledgeText := req.KnowledgeText
	if knowledgeText == "" && req.KnowledgeSourceID != "" {
		ksID, err := uuid.Parse(req.KnowledgeSourceID)
		if err == nil {
			ks, err := h.crawlRepo.GetKnowledgeSourceByID(r.Context(), ksID)
			if err == nil && ks != nil {
				knowledgeText = ks.ContentText
			}
		}
	}
	if knowledgeText == "" {
		response.Error(w, http.StatusBadRequest, "no knowledge content available")
		return
	}

	// Get AI config
	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team_id")
		return
	}
	config, err := h.aiRepo.GetDefaultConfig(r.Context(), teamID)
	if err != nil || config == nil || config.APIKey == "" {
		response.Error(w, http.StatusBadRequest, "No AI provider configured.")
		return
	}

	log.Printf("[Content Handler] Generating outline using %s/%s", config.ProviderName, config.ModelName)

	aiClient := llm.NewClientWithConfig(config.APIKey, config.BaseURL, config.ModelName, config.ProviderName)

	brief := llm.ContentBrief{
		Platform:               req.Platform,
		Tone:                   req.Tone,
		TargetAudience:         req.TargetAudience,
		AdditionalInstructions: req.AdditionalInstructions,
		Language:               req.Language,
		BrandName:              req.BrandName,
		BrandPersona:           req.BrandPersona,
		BrandGuidelines:        req.BrandGuidelines,
	}

	result, err := aiClient.GenerateMasterOutline(r.Context(), knowledgeText, brief)
	if err != nil {
		log.Printf("[Content Handler] ❌ Outline generation failed: %v", err)
		response.Error(w, http.StatusInternalServerError, "Outline generation failed: "+err.Error())
		return
	}

	log.Printf("[Content Handler] ✅ Outline generated. %d chars, %d tokens",
		len(result.OutlineJSON), result.TokenUsage.Total)

	response.JSON(w, http.StatusOK, result, "Outline generated successfully")
}
