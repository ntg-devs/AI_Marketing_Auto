package repository

import (
	"bityagi/internal/domain"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) domain.PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) GetCampaignHistoryByTeam(ctx context.Context, teamID uuid.UUID) ([]domain.CampaignHistoryItem, error) {
	// Query posts joined with publish_schedules for accurate channel/status info.
	query := `
		SELECT 
			p.id, 
			p.title, 
			COALESCE(p.topic, 'Untitled Campaign') as campaign_name,
			COALESCE(s.platform, p.platform, 'blog') as channel,
			CASE 
				WHEN p.status = 'published' THEN 'success'
				WHEN ps.status = 'failed' THEN 'failed'
				WHEN ps.status = 'scheduled' THEN 'scheduled'
				ELSE 'draft'
			END as status,
			COALESCE(ps.published_at, p.published_at, p.created_at) as published_at,
			ps.scheduled_at,
			p.content_html
		FROM posts p
		LEFT JOIN publish_schedules ps ON p.id = ps.post_id
		LEFT JOIN social_accounts s ON ps.social_account_id = s.id
		WHERE p.team_id = ?
		ORDER BY p.created_at DESC
		LIMIT 50
	`

	rows, err := r.db.WithContext(ctx).Raw(query, teamID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.CampaignHistoryItem
	for rows.Next() {
		var (
			id, campaignName, channel, status string
			title, contentHTML, publishedAt, scheduledAt *string
		)
		err := rows.Scan(&id, &title, &campaignName, &channel, &status, &publishedAt, &scheduledAt, &contentHTML)
		if err != nil {
			return nil, err
		}

		item := domain.CampaignHistoryItem{
			ID:                    id,
			CampaignName:          campaignName,
			Channel:               channel,
			Status:                status,
			Title:                 "Untitled",
			ContentHTML:           "",
			SparklineData:         []interface{}{},
			ResearchKnowledgeBase: []string{},
			Sources:               []interface{}{},
			AIAnalysis: map[string]any{
				"summary":        "AI Analysis pending for this campaign.",
				"sentiment":      "neutral",
				"keyFactors":     []string{},
				"recommendation": "",
			},
		}

		if publishedAt != nil {
			item.PublishedAt = *publishedAt
		}
		if scheduledAt != nil {
			item.ScheduledAt = *scheduledAt
		}
		if title != nil && *title != "" {
			item.Title = *title
		}
		if contentHTML != nil {
			item.ContentHTML = *contentHTML
		}

		results = append(results, item)
	}

	return results, nil
}

func (r *postRepository) CreatePost(ctx context.Context, post *domain.Post) error {
	return r.db.WithContext(ctx).Create(post).Error
}
