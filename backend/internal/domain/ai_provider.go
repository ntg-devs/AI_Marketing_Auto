package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AIProviderConfig struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID       uuid.UUID `json:"team_id" gorm:"type:uuid;not null;index"`
	ProviderName string    `json:"provider_name" gorm:"type:varchar(50);not null"`
	ModelName    string    `json:"model_name" gorm:"type:varchar(50);not null;default:'default'"`
	APIKey       string    `json:"api_key" gorm:"type:text;not null"`
	BaseURL      string    `json:"base_url,omitempty" gorm:"type:text"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type AIProviderRepository interface {
	SaveConfig(ctx context.Context, config *AIProviderConfig) error
	UpdateNonKeyFields(ctx context.Context, teamID uuid.UUID, providerName, modelName, baseURL string, isDefault bool) error
	GetConfigsByTeam(ctx context.Context, teamID uuid.UUID) ([]AIProviderConfig, error)
	GetDefaultConfig(ctx context.Context, teamID uuid.UUID) (*AIProviderConfig, error)
}
