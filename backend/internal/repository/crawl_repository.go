package repository

import (
	"bityagi/internal/domain"
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type crawlRepository struct {
	db *gorm.DB
}

func NewCrawlRepository(db *gorm.DB) domain.CrawlRepository {
	return &crawlRepository{db: db}
}

func (r *crawlRepository) CreateJob(ctx context.Context, job *domain.CrawlJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *crawlRepository) GetJobByID(ctx context.Context, jobID uuid.UUID) (*domain.CrawlJob, error) {
	var job domain.CrawlJob
	if err := r.db.WithContext(ctx).First(&job, "id = ?", jobID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &job, nil
}

func (r *crawlRepository) GetJobDetail(ctx context.Context, jobID uuid.UUID) (*domain.CrawlJobDetailResponse, error) {
	job, err := r.GetJobByID(ctx, jobID)
	if err != nil || job == nil {
		return nil, err
	}

	var pages []domain.CrawlPage
	if err := r.db.WithContext(ctx).
		Where("crawl_job_id = ?", jobID).
		Order("created_at asc").
		Find(&pages).Error; err != nil {
		return nil, err
	}

	var knowledge *domain.KnowledgeSource
	if job.KnowledgeSourceID != nil {
		var source domain.KnowledgeSource
		if err := r.db.WithContext(ctx).First(&source, "id = ?", *job.KnowledgeSourceID).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
		} else {
			knowledge = &source
		}
	}

	return &domain.CrawlJobDetailResponse{
		Job:             job,
		Pages:           pages,
		KnowledgeSource: knowledge,
	}, nil
}

func (r *crawlRepository) MarkJobRunning(ctx context.Context, jobID uuid.UUID) error {
	now := time.Now().UTC()

	return r.db.WithContext(ctx).
		Model(&domain.CrawlJob{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"status":     domain.CrawlJobStatusRunning,
			"started_at": &now,
			"error_log":  "",
		}).Error
}

func (r *crawlRepository) MarkJobFailed(ctx context.Context, jobID uuid.UUID, errorLog string) error {
	now := time.Now().UTC()

	return r.db.WithContext(ctx).
		Model(&domain.CrawlJob{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"status":       domain.CrawlJobStatusFailed,
			"error_log":    errorLog,
			"completed_at": &now,
		}).Error
}

func (r *crawlRepository) SaveJobResult(ctx context.Context, jobID uuid.UUID, result *domain.CrawlExtractionResult) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var job domain.CrawlJob
		if err := tx.First(&job, "id = ?", jobID).Error; err != nil {
			return err
		}

		now := time.Now().UTC()
		knowledgeID := uuid.New()

		sourceTitle := strings.TrimSpace(result.Title)
		if sourceTitle == "" {
			sourceTitle = job.SourceURL
		}

		sourceMetadata := mergeJSONMaps(result.Metadata, map[string]interface{}{
			"source_url":     job.SourceURL,
			"normalized_url": job.NormalizedURL,
			"final_url":      result.FinalURL,
			"canonical_url":  result.CanonicalURL,
			"crawl_job_id":   job.ID.String(),
			"strategy":       result.StrategyUsed,
			"provider":       result.ProviderUsed,
			"http_status":    result.HTTPStatus,
			"content_type":   result.ContentType,
			"description":    result.Description,
			"language":       result.Language,
		})

		knowledgeSource := &domain.KnowledgeSource{
			ID:          knowledgeID,
			TeamID:      job.TeamID,
			Title:       sourceTitle,
			SourceType:  "url_crawl",
			ContentText: result.ExtractedText,
			Metadata:    sourceMetadata,
			IsActive:    true,
		}
		if err := tx.Create(knowledgeSource).Error; err != nil {
			return err
		}

		if err := tx.Where("crawl_job_id = ?", job.ID).Delete(&domain.CrawlPage{}).Error; err != nil {
			return err
		}

		for _, page := range result.Pages {
			pageModel := &domain.CrawlPage{
				ID:            uuid.New(),
				CrawlJobID:    job.ID,
				URL:           page.URL,
				Title:         page.Title,
				Depth:         page.Depth,
				ContentType:   page.ContentType,
				Status:        defaultString(page.Status, "processed"),
				RawHTML:       page.RawHTML,
				ExtractedText: page.ExtractedText,
				MarkdownText:  page.MarkdownText,
				Metadata:      page.Metadata,
			}
			if err := tx.Create(pageModel).Error; err != nil {
				return err
			}
		}

		if len(result.Pages) == 0 {
			pageModel := &domain.CrawlPage{
				ID:            uuid.New(),
				CrawlJobID:    job.ID,
				URL:           defaultString(result.FinalURL, job.SourceURL),
				Title:         result.Title,
				Depth:         0,
				ContentType:   result.ContentType,
				Status:        "processed",
				RawHTML:       result.HTML,
				ExtractedText: result.ExtractedText,
				MarkdownText:  result.Markdown,
				Metadata:      result.Metadata,
			}
			if err := tx.Create(pageModel).Error; err != nil {
				return err
			}
		}

		return tx.Model(&domain.CrawlJob{}).
			Where("id = ?", job.ID).
			Updates(map[string]interface{}{
				"knowledge_source_id": knowledgeID,
				"final_url":           result.FinalURL,
				"status":              domain.CrawlJobStatusCompleted,
				"strategy":            defaultString(result.StrategyUsed, job.Strategy),
				"provider":            result.ProviderUsed,
				"http_status":         result.HTTPStatus,
				"pages_crawled":       maxInt(1, len(result.Pages)),
				"title":               result.Title,
				"response_metadata":   result.Metadata,
				"completed_at":        &now,
				"error_log":           "",
			}).Error
	})
}

func mergeJSONMaps(base map[string]interface{}, extra map[string]interface{}) map[string]interface{} {
	if base == nil && extra == nil {
		return nil
	}

	out := map[string]interface{}{}
	for k, v := range base {
		out[k] = v
	}
	for k, v := range extra {
		out[k] = v
	}

	return out
}

func defaultString(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
