package service

import (
	"bityagi/internal/domain"
	"bityagi/internal/task"
	"context"
	"errors"
	"fmt"
	neturl "net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

type crawlService struct {
	repo        domain.CrawlRepository
	distributor task.TaskDistributor
}

func NewCrawlService(repo domain.CrawlRepository, distributor task.TaskDistributor) domain.CrawlService {
	return &crawlService{
		repo:        repo,
		distributor: distributor,
	}
}

func (s *crawlService) StartURLResearch(ctx context.Context, req *domain.StartURLResearchRequest) (*domain.StartURLResearchResponse, error) {
	normalizedURL, err := normalizeURL(req.URL)
	if err != nil {
		return nil, err
	}

	strategy := normalizeStrategy(req.Strategy)
	maxPages := req.MaxPages
	if maxPages <= 0 {
		maxPages = 1
	}
	if maxPages > 10 {
		maxPages = 10
	}

	job := &domain.CrawlJob{
		ID:            uuid.New(),
		TeamID:        req.TeamID,
		UserID:        req.UserID,
		BriefID:       req.BriefID,
		SourceURL:     strings.TrimSpace(req.URL),
		NormalizedURL: normalizedURL,
		Status:        domain.CrawlJobStatusPending,
		Strategy:      strategy,
		RequestMetadata: map[string]interface{}{
			"max_pages":    maxPages,
			"use_stealth":  req.UseStealth,
			"proxy_region": req.ProxyRegion,
		},
	}

	if err := s.repo.CreateJob(ctx, job); err != nil {
		return nil, err
	}

	payload := &task.CrawlSourceURLPayload{
		JobID:       job.ID,
		URL:         normalizedURL,
		Strategy:    strategy,
		MaxPages:    maxPages,
		UseStealth:  req.UseStealth,
		ProxyRegion: req.ProxyRegion,
	}

	opts := []asynq.Option{
		asynq.Queue("default"),
		asynq.MaxRetry(3),
	}

	if err := s.distributor.DistributeTaskCrawlSourceURL(ctx, payload, opts...); err != nil {
		_ = s.repo.MarkJobFailed(ctx, job.ID, fmt.Sprintf("failed to enqueue crawl task: %v", err))
		return nil, err
	}

	return &domain.StartURLResearchResponse{
		JobID:    job.ID,
		Status:   job.Status,
		Strategy: strategy,
		Queue:    "default",
	}, nil
}

func (s *crawlService) GetJobDetail(ctx context.Context, jobID uuid.UUID) (*domain.CrawlJobDetailResponse, error) {
	detail, err := s.repo.GetJobDetail(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if detail == nil {
		return nil, errors.New("crawl job not found")
	}

	return detail, nil
}

func (s *crawlService) ListJobs(ctx context.Context, teamID uuid.UUID, limit, offset int) (*domain.CrawlJobListResponse, error) {
	return s.repo.ListJobs(ctx, teamID, limit, offset)
}

func (s *crawlService) DeleteJob(ctx context.Context, jobID uuid.UUID) error {
	return s.repo.DeleteJob(ctx, jobID)
}

func normalizeURL(raw string) (string, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return "", errors.New("url is required")
	}

	if !strings.HasPrefix(strings.ToLower(value), "http://") && !strings.HasPrefix(strings.ToLower(value), "https://") {
		value = "https://" + value
	}

	parsed, err := neturl.ParseRequestURI(value)
	if err != nil {
		return "", errors.New("invalid url")
	}

	parsed.Fragment = ""
	return parsed.String(), nil
}

func normalizeStrategy(strategy string) string {
	switch strings.ToLower(strings.TrimSpace(strategy)) {
	case domain.CrawlStrategyHTTP:
		return domain.CrawlStrategyHTTP
	case domain.CrawlStrategyBrowser:
		return domain.CrawlStrategyBrowser
	case domain.CrawlStrategyBrowserless:
		return domain.CrawlStrategyBrowserless
	default:
		return domain.CrawlStrategyAuto
	}
}
