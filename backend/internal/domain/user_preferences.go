package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// UserPreferences stores user-level configuration that persists across sessions.
// This includes content generation defaults, UI preferences, and brand DNA settings.
type UserPreferences struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex"`

	// Content Generation Defaults
	DefaultTone           string `json:"default_tone" gorm:"type:varchar(50);default:'professional'"`
	DefaultLanguage       string `json:"default_language" gorm:"type:varchar(10);default:'vi'"`
	DefaultContentLength  string `json:"default_content_length" gorm:"type:varchar(20);default:'medium'"`
	DefaultTargetAudience string `json:"default_target_audience" gorm:"type:text;default:''"`

	DefaultEditorMode string `json:"default_editor_mode" gorm:"type:varchar(20);default:'assets'"`
	DefaultPlatform   string `json:"default_platform" gorm:"type:varchar(20);default:'blog'"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserPreferencesRepository interface {
	Upsert(ctx context.Context, prefs *UserPreferences) error
	GetByUserID(ctx context.Context, userID uuid.UUID) (*UserPreferences, error)
}
