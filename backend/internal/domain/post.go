package domain

import (
	"context"

	"github.com/google/uuid"
)

// Post struct is already defined in domain/schedule.go

type CampaignHistoryItem struct {
	ID                    string         `json:"id"`
	Title                 string         `json:"title"`
	CampaignName          string         `json:"campaignName"`
	Channel               string         `json:"channel"`
	Status                string         `json:"status"` // success, failed, scheduled, in_progress, draft
	PublishedAt           string         `json:"publishedAt"`
	ScheduledAt           string         `json:"scheduledAt,omitempty"`
	SparklineData         []interface{}  `json:"sparklineData"`
	EngagementRate        float64        `json:"engagementRate"`
	Impressions           int            `json:"impressions"`
	Clicks                int            `json:"clicks"`
	ResearchKnowledgeBase []string       `json:"researchKnowledgeBase"`
	Sources               []interface{}  `json:"sources"`
	AIAnalysis            map[string]any `json:"aiAnalysis"`
	ContentHTML           string         `json:"contentHTML"`
}

type PostRepository interface {
	GetCampaignHistoryByTeam(ctx context.Context, teamID uuid.UUID) ([]CampaignHistoryItem, error)
	CreatePost(ctx context.Context, post *Post) error
}
