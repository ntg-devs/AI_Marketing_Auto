package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ─── Constants ───────────────────────────────────────────────────

const (
	ScheduleStatusScheduled  = "scheduled"
	ScheduleStatusProcessing = "processing"
	ScheduleStatusPublished  = "published"
	ScheduleStatusFailed     = "failed"
	ScheduleStatusCancelled  = "cancelled"

	PostStatusDraft     = "draft"
	PostStatusScheduled = "scheduled"
	PostStatusPublished = "published"
)

// ─── Domain Models ───────────────────────────────────────────────

// Post maps to the `posts` table in the database.
type Post struct {
	ID                 uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BriefID            *uuid.UUID             `json:"brief_id,omitempty" gorm:"type:uuid;index"`
	TeamID             uuid.UUID              `json:"team_id" gorm:"type:uuid;not null;index"`
	UserID             uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
	Title              string                 `json:"title"`
	Slug               string                 `json:"slug,omitempty" gorm:"unique"`
	Topic              string                 `json:"topic" gorm:"not null"`
	Excerpt            string                 `json:"excerpt,omitempty"`
	Keywords           []string               `json:"keywords,omitempty" gorm:"type:text[];serializer:json"`
	ContentHTML        string                 `json:"content_html,omitempty"`
	ContentJSON        map[string]interface{} `json:"content_json,omitempty" gorm:"type:jsonb;serializer:json"`
	CurrentVersion     int                    `json:"current_version" gorm:"default:1"`
	Language           string                 `json:"language" gorm:"type:varchar(10);default:'vi'"`
	Status             string                 `json:"status" gorm:"type:varchar(20);default:'draft'"`
	SEOScore           map[string]interface{} `json:"seo_score,omitempty" gorm:"type:jsonb;serializer:json"`
	FeaturedImageURL   string                 `json:"featured_image_url,omitempty"`
	PublishedAt        *time.Time             `json:"published_at,omitempty"`
	AIModelUsed        string                 `json:"ai_model_used,omitempty"`
	LastAIProcessedAt  *time.Time             `json:"last_ai_processed_at,omitempty"`
	CreatedAt          time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt          time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Post) TableName() string { return "posts" }

// SocialAccount maps to the `social_accounts` table.
type SocialAccount struct {
	ID                 uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID             uuid.UUID  `json:"team_id" gorm:"type:uuid;not null;index"`
	UserID             *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
	Platform           string     `json:"platform" gorm:"type:varchar(20);not null"`
	PlatformUserID     string     `json:"platform_user_id,omitempty"`
	PageID             string     `json:"page_id,omitempty"`
	AccessToken        string     `json:"-" gorm:"not null"` // Never expose
	RefreshToken       string     `json:"-"`
	TokenExpiresAt     *time.Time `json:"token_expires_at,omitempty"`
	ProfileName        string     `json:"profile_name,omitempty"`
	ProfileURL         string     `json:"profile_url,omitempty"`
	AvatarURL          string     `json:"avatar_url,omitempty"`
	Scopes             []string   `json:"scopes,omitempty" gorm:"type:text[];serializer:json"`
	IsActive           bool       `json:"is_active" gorm:"default:true"`
	LastSyncAt         *time.Time `json:"last_sync_at,omitempty"`
	RateLimitRemaining *int       `json:"rate_limit_remaining,omitempty"`
	RateLimitResetAt   *time.Time `json:"rate_limit_reset_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt          time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (SocialAccount) TableName() string { return "social_accounts" }

// PublishSchedule maps to the `publish_schedules` table.
type PublishSchedule struct {
	ID                uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PostID            uuid.UUID              `json:"post_id" gorm:"type:uuid;not null;index"`
	SocialAccountID   uuid.UUID              `json:"social_account_id" gorm:"type:uuid;not null;index"`
	ScheduledAt       time.Time              `json:"scheduled_at" gorm:"not null;index"`
	PublishedAt       *time.Time             `json:"published_at,omitempty"`
	Status            string                 `json:"status" gorm:"type:varchar(20);default:'scheduled'"`
	ExternalPostID    string                 `json:"external_post_id,omitempty"`
	ExternalPostURL   string                 `json:"external_post_url,omitempty"`
	EngagementMetrics map[string]interface{} `json:"engagement_metrics,omitempty" gorm:"type:jsonb;serializer:json"`
	RetryCount        int                    `json:"retry_count" gorm:"default:0"`
	ErrorMessage      string                 `json:"error_message,omitempty"`
	CreatedAt         time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time              `json:"updated_at" gorm:"autoUpdateTime"`

	// Eager-loaded relations (not stored, populated by queries)
	Post          *Post          `json:"post,omitempty" gorm:"foreignKey:PostID"`
	SocialAccount *SocialAccount `json:"social_account,omitempty" gorm:"foreignKey:SocialAccountID"`
}

func (PublishSchedule) TableName() string { return "publish_schedules" }

// ─── Request / Response DTOs ─────────────────────────────────────

type CreateScheduleRequest struct {
	TeamID          string `json:"team_id" validate:"required"`
	UserID          string `json:"user_id" validate:"required"`
	Platform        string `json:"platform" validate:"required"`        // facebook, linkedin, blog
	Title           string `json:"title" validate:"required"`
	Topic           string `json:"topic"`
	ContentHTML     string `json:"content_html"`
	ScheduledAt     string `json:"scheduled_at" validate:"required"`    // ISO 8601
	SocialAccountID string `json:"social_account_id"`                   // Optional — auto-resolve if not given
}

type UpdateScheduleRequest struct {
	ScheduledAt  *string `json:"scheduled_at,omitempty"`
	Status       *string `json:"status,omitempty"`
}

type ScheduleDetailResponse struct {
	Schedule *PublishSchedule `json:"schedule"`
	Post     *Post            `json:"post,omitempty"`
}

type ScheduleListResponse struct {
	Schedules []PublishSchedule `json:"schedules"`
	Total     int64             `json:"total"`
}

// ─── Repository Interface ────────────────────────────────────────

type ScheduleRepository interface {
	// Posts
	CreatePost(ctx context.Context, post *Post) error
	GetPostByID(ctx context.Context, id uuid.UUID) (*Post, error)
	UpdatePostStatus(ctx context.Context, id uuid.UUID, status string) error

	// Schedules
	CreateSchedule(ctx context.Context, schedule *PublishSchedule) error
	GetScheduleByID(ctx context.Context, id uuid.UUID) (*PublishSchedule, error)
	ListSchedulesByTeam(ctx context.Context, teamID uuid.UUID, limit, offset int) (*ScheduleListResponse, error)
	UpdateSchedule(ctx context.Context, id uuid.UUID, updates map[string]interface{}) error
	DeleteSchedule(ctx context.Context, id uuid.UUID) error
	GetDueSchedules(ctx context.Context, before time.Time) ([]PublishSchedule, error)
	MarkSchedulePublished(ctx context.Context, id uuid.UUID, externalPostID, externalPostURL string) error
	MarkScheduleFailed(ctx context.Context, id uuid.UUID, errorMsg string) error

	// Social Accounts
	GetSocialAccountByID(ctx context.Context, id uuid.UUID) (*SocialAccount, error)
	GetSocialAccountByPlatform(ctx context.Context, teamID uuid.UUID, platform string) (*SocialAccount, error)
	EnsureSocialAccount(ctx context.Context, teamID uuid.UUID, platform string) (*SocialAccount, error)
}

// ─── Service Interface ───────────────────────────────────────────

type ScheduleService interface {
	CreateAndSchedule(ctx context.Context, req *CreateScheduleRequest) (*ScheduleDetailResponse, error)
	GetSchedule(ctx context.Context, id uuid.UUID) (*ScheduleDetailResponse, error)
	ListSchedules(ctx context.Context, teamID uuid.UUID, limit, offset int) (*ScheduleListResponse, error)
	UpdateSchedule(ctx context.Context, id uuid.UUID, req *UpdateScheduleRequest) error
	DeleteSchedule(ctx context.Context, id uuid.UUID) error
	PublishDueSchedules(ctx context.Context) (int, error)
}
