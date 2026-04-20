package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type postHandler struct {
	postRepo domain.PostRepository
}

func NewPostHandler(postRepo domain.PostRepository) *postHandler {
	return &postHandler{postRepo: postRepo}
}

func (h *postHandler) RegisterRoutes(r chi.Router) {
	r.Route("/posts", func(r chi.Router) {
		r.Get("/history", h.GetCampaignHistory)
	})
}

func (h *postHandler) GetCampaignHistory(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		response.Error(w, http.StatusUnauthorized, "User context not found")
		return
	}

	history, err := h.postRepo.GetCampaignHistoryByTeam(r.Context(), user.TeamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to retrieve campaign history: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{"items": history}, "Campaign history retrieved successfully")
}
