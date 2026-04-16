package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type userPreferencesHandler struct {
	repo domain.UserPreferencesRepository
}

func NewUserPreferencesHandler(repo domain.UserPreferencesRepository) *userPreferencesHandler {
	return &userPreferencesHandler{repo: repo}
}

// GetPreferences returns the user's saved preferences.
// GET /api/v1/users/{userID}/preferences
func (h *userPreferencesHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	prefs, err := h.repo.GetByUserID(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to load preferences")
		return
	}

	if prefs == nil {
		// Return empty defaults instead of null
		prefs = &domain.UserPreferences{
			UserID:               userID,
			DefaultTone:          "professional",
			DefaultLanguage:      "vi",
			DefaultContentLength: "medium",
			DefaultEditorMode:    "assets",
			DefaultPlatform:      "blog",
		}
	}

	response.JSON(w, http.StatusOK, prefs, "preferences loaded")
}

// SavePreferences upserts user preferences.
// PUT /api/v1/users/{userID}/preferences
func (h *userPreferencesHandler) SavePreferences(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req struct {
		DefaultTone          string `json:"default_tone"`
		DefaultLanguage      string `json:"default_language"`
		DefaultContentLength string `json:"default_content_length"`
		DefaultTargetAudience string `json:"default_target_audience"`
		DefaultEditorMode    string `json:"default_editor_mode"`
		DefaultPlatform      string `json:"default_platform"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	prefs := &domain.UserPreferences{
		UserID:               userID,
		DefaultTone:          defaultStr(req.DefaultTone, "professional"),
		DefaultLanguage:      defaultStr(req.DefaultLanguage, "vi"),
		DefaultContentLength: defaultStr(req.DefaultContentLength, "medium"),
		DefaultTargetAudience: req.DefaultTargetAudience,
		DefaultEditorMode:    defaultStr(req.DefaultEditorMode, "assets"),
		DefaultPlatform:      defaultStr(req.DefaultPlatform, "blog"),
	}

	if err := h.repo.Upsert(r.Context(), prefs); err != nil {
		log.Printf("[Preferences] ❌ Failed to save preferences for user %s: %v", userID, err)
		response.Error(w, http.StatusInternalServerError, "failed to save preferences")
		return
	}

	log.Printf("[Preferences] ✅ Saved preferences for user %s", userID)
	response.JSON(w, http.StatusOK, prefs, "preferences saved successfully")
}

func defaultStr(val, fallback string) string {
	if val == "" {
		return fallback
	}
	return val
}
