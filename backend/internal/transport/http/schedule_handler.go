package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type scheduleHandler struct {
	service domain.ScheduleService
}

func NewScheduleHandler(service domain.ScheduleService) *scheduleHandler {
	return &scheduleHandler{service: service}
}

// POST /api/v1/schedules
func (h *scheduleHandler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TeamID == "" {
		response.Error(w, http.StatusBadRequest, "team_id is required")
		return
	}
	if req.UserID == "" {
		response.Error(w, http.StatusBadRequest, "user_id is required")
		return
	}
	if req.Title == "" {
		response.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if req.Platform == "" {
		response.Error(w, http.StatusBadRequest, "platform is required")
		return
	}
	if req.ScheduledAt == "" {
		response.Error(w, http.StatusBadRequest, "scheduled_at is required")
		return
	}

	result, err := h.service.CreateAndSchedule(r.Context(), &req)
	if err != nil {
		log.Printf("[Schedule Handler] ❌ Create failed: %v", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	log.Printf("[Schedule Handler] ✅ Schedule created: %s", result.Schedule.ID)
	response.JSON(w, http.StatusCreated, result, "Schedule created successfully")
}

// GET /api/v1/schedules?team_id=...&limit=...&offset=...
func (h *scheduleHandler) ListSchedules(w http.ResponseWriter, r *http.Request) {
	teamIDStr := r.URL.Query().Get("team_id")
	if teamIDStr == "" {
		response.Error(w, http.StatusBadRequest, "team_id query param is required")
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
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	result, err := h.service.ListSchedules(r.Context(), teamID, limit, offset)
	if err != nil {
		log.Printf("[Schedule Handler] ❌ List failed: %v", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result, "Schedules retrieved successfully")
}

// GET /api/v1/schedules/{scheduleID}
func (h *scheduleHandler) GetSchedule(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "scheduleID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid schedule ID")
		return
	}

	result, err := h.service.GetSchedule(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "schedule not found")
		return
	}

	response.JSON(w, http.StatusOK, result, "Schedule retrieved")
}

// PUT /api/v1/schedules/{scheduleID}
func (h *scheduleHandler) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "scheduleID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid schedule ID")
		return
	}

	var req domain.UpdateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.UpdateSchedule(r.Context(), id, &req); err != nil {
		log.Printf("[Schedule Handler] ❌ Update failed: %v", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, nil, "Schedule updated successfully")
}

// DELETE /api/v1/schedules/{scheduleID}
func (h *scheduleHandler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "scheduleID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid schedule ID")
		return
	}

	if err := h.service.DeleteSchedule(r.Context(), id); err != nil {
		log.Printf("[Schedule Handler] ❌ Delete failed: %v", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, nil, "Schedule deleted")
}

// POST /api/v1/schedules/publish-due
func (h *scheduleHandler) PublishDue(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.PublishDueSchedules(r.Context())
	if err != nil {
		log.Printf("[Schedule Handler] ❌ Publish due failed: %v", err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]int{"published_count": count}, "Published due schedules")
}

// GET /api/v1/social-accounts?team_id=...
func (h *scheduleHandler) ListSocialAccounts(w http.ResponseWriter, r *http.Request) {
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

	res, err := h.service.ListSocialAccounts(r.Context(), teamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, res, "Social accounts retrieved")
}

// POST /api/v1/social-accounts
func (h *scheduleHandler) SaveSocialAccount(w http.ResponseWriter, r *http.Request) {
	var acc domain.SocialAccount
	if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.SaveSocialAccount(r.Context(), &acc); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, acc, "Social account saved")
}

// DELETE /api/v1/social-accounts/{id}
func (h *scheduleHandler) DeleteSocialAccount(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.service.DeleteSocialAccount(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, nil, "Social account deleted")
}
