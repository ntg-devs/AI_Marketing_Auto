package task

import (
	"encoding/json"

	"github.com/google/uuid"
)

const (
	TypeGenerateContent  = "task:generate_content"
	TypeSendWelcomeEmail = "task:send_welcome_email"
	TypeCrawlSourceURL   = "task:crawl_source_url"
	TypeAnalyzeImageURL  = "task:analyze_image_url"
)

type GenerateContentPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Prompt string    `json:"prompt"`
	Target string    `json:"target"` // e.g., "facebook", "linkedin"
}

type SendWelcomeEmailPayload struct {
	UserEmail string `json:"user_email"`
	FullName  string `json:"full_name"`
	OTP       string `json:"otp,omitempty"`
}

type CrawlSourceURLPayload struct {
	JobID       uuid.UUID `json:"job_id"`
	URL         string    `json:"url"`
	ImageURL    string    `json:"image_url,omitempty"`
	Strategy    string    `json:"strategy"`
	MaxPages    int       `json:"max_pages"`
	UseStealth  bool      `json:"use_stealth,omitempty"`
	ProxyRegion string    `json:"proxy_region,omitempty"`
}

type AnalyzeImageURLPayload struct {
	JobID    uuid.UUID `json:"job_id"`
	ImageURL string    `json:"image_url"`
	TeamID   uuid.UUID `json:"team_id"`
}

func MarshalPayload(payload interface{}) ([]byte, error) {
	return json.Marshal(payload)
}
