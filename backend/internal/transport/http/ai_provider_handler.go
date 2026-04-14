package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type aiProviderHandler struct {
	repo domain.AIProviderRepository
}

func NewAIProviderHandler(repo domain.AIProviderRepository) *aiProviderHandler {
	return &aiProviderHandler{repo: repo}
}

func (h *aiProviderHandler) SaveConfig(w http.ResponseWriter, r *http.Request) {
	teamIDStr := chi.URLParam(r, "teamID")
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team id")
		return
	}

	var req struct {
		Configs []struct {
			ProviderName string `json:"provider_name"`
			ModelName    string `json:"model_name"`
			APIKey       string `json:"api_key"`
			BaseURL      string `json:"base_url"`
			IsDefault    bool   `json:"is_default"`
		} `json:"configs"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	for _, cfg := range req.Configs {
		if cfg.APIKey != "" {
			// Full upsert — user provided a new key
			model := &domain.AIProviderConfig{
				TeamID:       teamID,
				ProviderName: cfg.ProviderName,
				ModelName:    cfg.ModelName,
				APIKey:       cfg.APIKey,
				BaseURL:      cfg.BaseURL,
				IsDefault:    cfg.IsDefault,
			}
			if err := h.repo.SaveConfig(r.Context(), model); err != nil {
				response.Error(w, http.StatusInternalServerError, "failed to save config")
				return
			}
		} else {
			// No key provided — update non-sensitive fields only (keep existing key)
			if err := h.repo.UpdateNonKeyFields(r.Context(), teamID, cfg.ProviderName, cfg.ModelName, cfg.BaseURL, cfg.IsDefault); err != nil {
				response.Error(w, http.StatusInternalServerError, "failed to update config")
				return
			}
		}
	}

	response.JSON(w, http.StatusOK, nil, "AI configurations saved successfully")
}

func (h *aiProviderHandler) GetConfigs(w http.ResponseWriter, r *http.Request) {
	teamIDStr := chi.URLParam(r, "teamID")
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team id")
		return
	}

	configs, err := h.repo.GetConfigsByTeam(r.Context(), teamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to fetch configs")
		return
	}

	// Build response with masked keys for display, real keys never leave the server
	type configResponse struct {
		ID           uuid.UUID `json:"id"`
		TeamID       uuid.UUID `json:"team_id"`
		ProviderName string    `json:"provider_name"`
		ModelName    string    `json:"model_name"`
		APIKey       string    `json:"api_key"`
		MaskedKey    string    `json:"masked_key"`
		BaseURL      string    `json:"base_url,omitempty"`
		IsDefault    bool      `json:"is_default"`
	}

	result := make([]configResponse, len(configs))
	for i, cfg := range configs {
		masked := ""
		if len(cfg.APIKey) > 10 {
			masked = cfg.APIKey[:6] + "..." + cfg.APIKey[len(cfg.APIKey)-4:]
		} else if len(cfg.APIKey) > 0 {
			masked = "••••••"
		}
		result[i] = configResponse{
			ID:           cfg.ID,
			TeamID:       cfg.TeamID,
			ProviderName: cfg.ProviderName,
			ModelName:    cfg.ModelName,
			APIKey:       "", // Never return the real key
			MaskedKey:    masked,
			BaseURL:      cfg.BaseURL,
			IsDefault:    cfg.IsDefault,
		}
	}

	response.JSON(w, http.StatusOK, result, "configs loaded")
}
