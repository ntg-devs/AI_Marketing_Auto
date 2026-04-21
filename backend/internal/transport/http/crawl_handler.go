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

type crawlHandler struct {
	service domain.CrawlService
}

func NewCrawlHandler(service domain.CrawlService) *crawlHandler {
	return &crawlHandler{service: service}
}

func (h *crawlHandler) SubmitURL(w http.ResponseWriter, r *http.Request) {
	var req domain.StartURLResearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[CrawlHandler] JSON Decode error: %v", err)
		response.Error(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	res, err := h.service.StartURLResearch(r.Context(), &req)
	if err != nil {
		log.Printf("[CrawlHandler] StartURLResearch error: %v", err)
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusAccepted, res, "URL research job created")
}

func (h *crawlHandler) GetJob(w http.ResponseWriter, r *http.Request) {
	jobID, err := uuid.Parse(chi.URLParam(r, "jobID"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid job id")
		return
	}

	res, err := h.service.GetJobDetail(r.Context(), jobID)
	if err != nil {
		response.Error(w, http.StatusNotFound, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "Crawl job detail loaded")
}

func (h *crawlHandler) ListJobs(w http.ResponseWriter, r *http.Request) {
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

	res, err := h.service.ListJobs(r.Context(), teamID, 50, 0)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "Crawl jobs listed")
}

func (h *crawlHandler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	jobID, err := uuid.Parse(chi.URLParam(r, "jobID"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid job id")
		return
	}

	if err := h.service.DeleteJob(r.Context(), jobID); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, nil, "Crawl job deleted")
}

func (h *crawlHandler) GetLiveResearch(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.GetLiveResearch(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "Live research data fetched")
}
