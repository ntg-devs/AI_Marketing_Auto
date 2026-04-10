package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"encoding/json"
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
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.service.StartURLResearch(r.Context(), &req)
	if err != nil {
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
