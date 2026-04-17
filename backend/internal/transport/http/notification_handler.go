package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type notificationHandler struct {
	repo domain.NotificationRepository
}

func NewNotificationHandler(repo domain.NotificationRepository) *notificationHandler {
	return &notificationHandler{repo: repo}
}

func (h *notificationHandler) List(w http.ResponseWriter, r *http.Request) {
	teamIDStr := r.URL.Query().Get("team_id")
	if teamIDStr == "" {
		response.Error(w, http.StatusBadRequest, "team_id is required")
		return
	}
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team_id")
		return
	}

	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		limit, _ = strconv.Atoi(l)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		offset, _ = strconv.Atoi(o)
	}

	ns, total, err := h.repo.ListByTeam(r.Context(), teamID, limit, offset)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"notifications": ns,
		"total":         total,
	}, "Notifications retrieved")
}

func (h *notificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.repo.MarkAsRead(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, nil, "Notification marked as read")
}

func (h *notificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	teamIDStr := r.URL.Query().Get("team_id")
	if teamIDStr == "" {
		response.Error(w, http.StatusBadRequest, "team_id is required")
		return
	}
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid team_id")
		return
	}

	if err := h.repo.MarkAllAsRead(r.Context(), teamID); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, nil, "All notifications marked as read")
}
