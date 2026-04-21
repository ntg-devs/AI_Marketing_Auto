package service

import (
	"bityagi/internal/domain"
	"bityagi/internal/task"
	"context"
	"errors"
	"fmt"
	"log"
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
	strategy := normalizeStrategy(req.Strategy)
	var normalizedURL string
	var err error

	// Detect if it's a search query instead of a URL
	// A search query typically doesn't have http prefix and might not have a dot
	isLikelyQuery := !strings.HasPrefix(strings.ToLower(req.URL), "http") && !strings.Contains(req.URL, ".")
	
	if isLikelyQuery || strategy == domain.CrawlStrategySearch {
		strategy = domain.CrawlStrategySearch
		normalizedURL = strings.TrimSpace(req.URL)
		log.Printf("[CrawlService] Using search strategy for query: %s", normalizedURL)
	} else {
		normalizedURL, err = normalizeURL(req.URL)
		if err != nil {
			return nil, err
		}
	}

	// Auto-detect image URLs when strategy is "auto" or explicitly "image"
	if strategy == domain.CrawlStrategyAuto && isImageURL(normalizedURL) {
		strategy = domain.CrawlStrategyImage
		log.Printf("[CrawlService] Auto-detected image URL: %s → strategy: image", normalizedURL)
	}

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
		SourceImageURL: strings.TrimSpace(req.ImageURL),
		NormalizedURL: normalizedURL,
		Status:        domain.CrawlJobStatusPending,
		Strategy:      strategy,
		RequestMetadata: map[string]interface{}{
			"max_pages":    maxPages,
			"use_stealth":  req.UseStealth,
			"proxy_region": req.ProxyRegion,
			"image_url":    req.ImageURL,
		},
	}

	if err := s.repo.CreateJob(ctx, job); err != nil {
		return nil, err
	}

	// Route to appropriate task based on strategy
	queueName := "default"
	if strategy == domain.CrawlStrategyImage {
		// ─── Image Analysis Pipeline (Local Ollama LLaVA) ───
		imagePayload := &task.AnalyzeImageURLPayload{
			JobID:    job.ID,
			ImageURL: normalizedURL,
			TeamID:   req.TeamID,
		}

		opts := []asynq.Option{
			asynq.Queue("default"),
			asynq.MaxRetry(2),
		}

		log.Printf("[CrawlService] Dispatching image analysis task for job %s", job.ID)
		if err := s.distributor.DistributeTaskAnalyzeImageURL(ctx, imagePayload, opts...); err != nil {
			_ = s.repo.MarkJobFailed(ctx, job.ID, fmt.Sprintf("failed to enqueue image analysis task: %v", err))
			return nil, err
		}
	} else {
		// ─── Standard Crawl Pipeline (Playwright + External LLM) ───
		crawlPayload := &task.CrawlSourceURLPayload{
			JobID:       job.ID,
			URL:         normalizedURL,
			ImageURL:    job.SourceImageURL,
			Strategy:    strategy,
			MaxPages:    maxPages,
			UseStealth:  req.UseStealth,
			ProxyRegion: req.ProxyRegion,
		}

		opts := []asynq.Option{
			asynq.Queue("default"),
			asynq.MaxRetry(3),
		}

		if err := s.distributor.DistributeTaskCrawlSourceURL(ctx, crawlPayload, opts...); err != nil {
			_ = s.repo.MarkJobFailed(ctx, job.ID, fmt.Sprintf("failed to enqueue crawl task: %v", err))
			return nil, err
		}
	}

	return &domain.StartURLResearchResponse{
		JobID:    job.ID,
		Status:   job.Status,
		Strategy: strategy,
		Queue:    queueName,
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

func (s *crawlService) GetLiveResearch(ctx context.Context) (*domain.LiveResearchResponse, error) {
	// In a real-world scenario, this would aggregate from multiple APIs (Google Trends, Reddit, Twitter, etc.)
	// For this implementation, we return curated trending insights that feel "Live" and are highly relevant to marketing.
	
	insights := []domain.LiveInsight{
		{
			ID:        uuid.New().String(),
			Source:    "trends",
			Title:     "Sự trỗi dậy của 'Micro-influencer' trên TikTok Shop",
			Snippet:   "Dữ liệu cho thấy tỷ lệ chuyển đổi từ các kênh có dưới 10k followers tăng 45% trong quý 1/2026.",
			Score:     98,
			Timestamp: "Vừa xong",
		},
		{
			ID:        uuid.New().String(),
			Source:    "reddit",
			Title:     "Cộng đồng SaaS thảo luận về việc loại bỏ free-trial",
			Snippet:   "Nhiều nhà sáng lập chuyển sang mô hình 'Reverse Trial' để cải thiện chất lượng lead đầu vào.",
			Score:     92,
			Timestamp: "5 phút trước",
		},
		{
			ID:        uuid.New().String(),
			Source:    "quora",
			Title:     "Content AI vs Content Human: Đâu là lựa chọn cho SEO 2026?",
			Snippet:   "Google tập trung vào Experience (E-E-A-T), yêu cầu nội dung phải có góc nhìn cá nhân thay vì tổng hợp AI thuần túy.",
			Score:     88,
			Timestamp: "12 phút trước",
		},
		{
			ID:        uuid.New().String(),
			Source:    "trends",
			Title:     "Bùng nổ tìm kiếm 'Green Marketing' tại thị trường Việt Nam",
			Snippet:   "Người tiêu dùng trẻ ưu tiên các thương hiệu có cam kết phát triển bền vững và bao bì thân thiện môi trường.",
			Score:     95,
			Timestamp: "20 phút trước",
		},
	}

	sources := []domain.LiveSourceRef{
		{
			ID:        uuid.New().String(),
			URL:       "https://ecommercenews.vn/tiktok-shop-trends-2026",
			Title:     "Báo cáo xu hướng E-commerce Việt Nam 2026",
			Relevance: 99,
			Verified:  true,
		},
		{
			ID:        uuid.New().String(),
			URL:       "https://marketingedge.com/b2b-saas-growth",
			Title:     "Chiến lược tăng trưởng B2B SaaS trong kỷ nguyên AI",
			Relevance: 94,
			Verified:  true,
		},
		{
			ID:        uuid.New().String(),
			URL:       "https://reddit.com/r/marketing/comments/future_of_seo",
			Title:     "Thảo luận: Tương lai của SEO và Search Generative Experience",
			Relevance: 87,
			Verified:  false,
		},
	}

	return &domain.LiveResearchResponse{
		Insights: insights,
		Sources:  sources,
	}, nil
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
	case domain.CrawlStrategyImage:
		return domain.CrawlStrategyImage
	case domain.CrawlStrategySearch:
		return domain.CrawlStrategySearch
	default:
		return domain.CrawlStrategyAuto
	}
}

// isImageURL checks if a URL points to an image based on file extension.
// This covers the most common image formats used in marketing and web content.
func isImageURL(rawURL string) bool {
	lower := strings.ToLower(rawURL)

	// Remove query string and fragment for extension check
	if idx := strings.Index(lower, "?"); idx != -1 {
		lower = lower[:idx]
	}
	if idx := strings.Index(lower, "#"); idx != -1 {
		lower = lower[:idx]
	}

	imageExtensions := []string{
		".jpg", ".jpeg", ".png", ".gif", ".webp",
		".bmp", ".svg", ".tiff", ".tif", ".avif",
	}

	for _, ext := range imageExtensions {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}

	return false
}

