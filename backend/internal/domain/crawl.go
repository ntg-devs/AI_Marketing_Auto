package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const (
	CrawlJobStatusPending   = "pending"
	CrawlJobStatusRunning   = "running"
	CrawlJobStatusCompleted = "completed"
	CrawlJobStatusFailed    = "failed"

	CrawlStrategyAuto        = "auto"
	CrawlStrategyHTTP        = "http"
	CrawlStrategyBrowser     = "browser"
	CrawlStrategyBrowserless = "browserless"
)

type CrawlJob struct {
	ID                uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID            uuid.UUID              `json:"team_id" gorm:"type:uuid;not null;index"`
	UserID            *uuid.UUID             `json:"user_id,omitempty" gorm:"type:uuid;index"`
	BriefID           *uuid.UUID             `json:"brief_id,omitempty" gorm:"type:uuid;index"`
	KnowledgeSourceID *uuid.UUID             `json:"knowledge_source_id,omitempty" gorm:"type:uuid;index"`
	SourceURL         string                 `json:"source_url" gorm:"not null"`
	NormalizedURL     string                 `json:"normalized_url" gorm:"not null;index"`
	FinalURL          string                 `json:"final_url,omitempty"`
	Status            string                 `json:"status" gorm:"type:varchar(20);not null;default:'pending';index"`
	Strategy          string                 `json:"strategy" gorm:"type:varchar(20);not null;default:'auto'"`
	Provider          string                 `json:"provider,omitempty" gorm:"type:varchar(50)"`
	HTTPStatus        int                    `json:"http_status,omitempty"`
	PagesCrawled      int                    `json:"pages_crawled"`
	Title             string                 `json:"title,omitempty"`
	ErrorLog          string                 `json:"error_log,omitempty"`
	RequestMetadata   map[string]interface{} `json:"request_metadata,omitempty" gorm:"type:jsonb;serializer:json"`
	ResponseMetadata  map[string]interface{} `json:"response_metadata,omitempty" gorm:"type:jsonb;serializer:json"`
	StartedAt         *time.Time             `json:"started_at,omitempty"`
	CompletedAt       *time.Time             `json:"completed_at,omitempty"`
	CreatedAt         time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

type CrawlPage struct {
	ID            uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CrawlJobID    uuid.UUID              `json:"crawl_job_id" gorm:"type:uuid;not null;index"`
	URL           string                 `json:"url" gorm:"not null"`
	Title         string                 `json:"title,omitempty"`
	Depth         int                    `json:"depth"`
	ContentType   string                 `json:"content_type,omitempty" gorm:"type:varchar(100)"`
	Status        string                 `json:"status" gorm:"type:varchar(20);default:'processed'"`
	RawHTML       string                 `json:"raw_html,omitempty"`
	ExtractedText string                 `json:"extracted_text,omitempty"`
	MarkdownText  string                 `json:"markdown_text,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty" gorm:"type:jsonb;serializer:json"`
	CreatedAt     time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

type KnowledgeSource struct {
	ID             uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID         uuid.UUID              `json:"team_id" gorm:"type:uuid;not null;index"`
	Title          string                 `json:"title"`
	SourceType     string                 `json:"source_type" gorm:"type:varchar(20);not null"`
	ContentText    string                 `json:"content_text"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" gorm:"type:jsonb;serializer:json"`
	VectorID       string                 `json:"vector_id,omitempty"`
	EmbeddingModel string                 `json:"embedding_model,omitempty"`
	TokenCount     int                    `json:"token_count,omitempty"`
	LastUsedAt     *time.Time             `json:"last_used_at,omitempty"`
	IsActive       bool                   `json:"is_active" gorm:"default:true"`
	CreatedAt      time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

type StartURLResearchRequest struct {
	TeamID      uuid.UUID  `json:"team_id"`
	UserID      *uuid.UUID `json:"user_id,omitempty"`
	BriefID     *uuid.UUID `json:"brief_id,omitempty"`
	URL         string     `json:"url"`
	Strategy    string     `json:"strategy,omitempty"`
	MaxPages    int        `json:"max_pages,omitempty"`
	UseStealth  bool       `json:"use_stealth,omitempty"`
	ProxyRegion string     `json:"proxy_region,omitempty"`
}

type StartURLResearchResponse struct {
	JobID    uuid.UUID `json:"job_id"`
	Status   string    `json:"status"`
	Strategy string    `json:"strategy"`
	Queue    string    `json:"queue"`
}

type CrawlJobDetailResponse struct {
	Job             *CrawlJob        `json:"job"`
	Pages           []CrawlPage      `json:"pages,omitempty"`
	KnowledgeSource *KnowledgeSource `json:"knowledge_source,omitempty"`
}

type CrawlJobListResponse struct {
	Jobs  []CrawlJob `json:"jobs"`
	Total int64      `json:"total"`
}

type CrawlExtractionResult struct {
	FinalURL      string                 `json:"final_url"`
	StrategyUsed  string                 `json:"strategy_used"`
	ProviderUsed  string                 `json:"provider_used"`
	HTTPStatus    int                    `json:"http_status"`
	Title         string                 `json:"title"`
	Description   string                 `json:"description"`
	Language      string                 `json:"language"`
	CanonicalURL  string                 `json:"canonical_url"`
	ContentType   string                 `json:"content_type"`
	HTML          string                 `json:"html"`
	ExtractedText string                 `json:"extracted_text"`
	Markdown      string                 `json:"markdown"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Pages         []CrawlPageResult      `json:"pages,omitempty"`
}

type CrawlPageResult struct {
	URL           string                 `json:"url"`
	Title         string                 `json:"title"`
	Depth         int                    `json:"depth"`
	ContentType   string                 `json:"content_type"`
	Status        string                 `json:"status"`
	RawHTML       string                 `json:"raw_html"`
	ExtractedText string                 `json:"extracted_text"`
	MarkdownText  string                 `json:"markdown_text"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

type CrawlRepository interface {
	CreateJob(ctx context.Context, job *CrawlJob) error
	GetJobByID(ctx context.Context, jobID uuid.UUID) (*CrawlJob, error)
	GetJobDetail(ctx context.Context, jobID uuid.UUID) (*CrawlJobDetailResponse, error)
	ListJobs(ctx context.Context, teamID uuid.UUID, limit, offset int) (*CrawlJobListResponse, error)
	DeleteJob(ctx context.Context, jobID uuid.UUID) error
	MarkJobRunning(ctx context.Context, jobID uuid.UUID) error
	MarkJobFailed(ctx context.Context, jobID uuid.UUID, errorLog string) error
	SaveJobResult(ctx context.Context, jobID uuid.UUID, result *CrawlExtractionResult) error
}

type CrawlService interface {
	StartURLResearch(ctx context.Context, req *StartURLResearchRequest) (*StartURLResearchResponse, error)
	GetJobDetail(ctx context.Context, jobID uuid.UUID) (*CrawlJobDetailResponse, error)
	ListJobs(ctx context.Context, teamID uuid.UUID, limit, offset int) (*CrawlJobListResponse, error)
	DeleteJob(ctx context.Context, jobID uuid.UUID) error
}
