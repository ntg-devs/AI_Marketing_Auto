package repository

import (
	"bityagi/internal/domain"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type aiProviderRepository struct {
	db *gorm.DB
}

func NewAIProviderRepository(db *gorm.DB) domain.AIProviderRepository {
	return &aiProviderRepository{db: db}
}

func (r *aiProviderRepository) SaveConfig(ctx context.Context, config *domain.AIProviderConfig) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// If set to default, unset others for this team
		if config.IsDefault {
			if err := tx.Model(&domain.AIProviderConfig{}).
				Where("team_id = ?", config.TeamID).
				Update("is_default", false).Error; err != nil {
				return err
			}
		}

		// Upsert approach based on team_id and provider_name
		var existing domain.AIProviderConfig
		err := tx.Where("team_id = ? AND provider_name = ?", config.TeamID, config.ProviderName).First(&existing).Error
		if err == nil {
			// Update
			return tx.Model(&existing).Updates(map[string]interface{}{
				"model_name": config.ModelName,
				"api_key":    config.APIKey,
				"base_url":   config.BaseURL,
				"is_default": config.IsDefault,
			}).Error
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create
			return tx.Create(config).Error
		}
		return err
	})
}

func (r *aiProviderRepository) GetConfigsByTeam(ctx context.Context, teamID uuid.UUID) ([]domain.AIProviderConfig, error) {
	var configs []domain.AIProviderConfig
	if err := r.db.WithContext(ctx).Where("team_id = ?", teamID).Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *aiProviderRepository) UpdateNonKeyFields(ctx context.Context, teamID uuid.UUID, providerName, modelName, baseURL string, isDefault bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// If set to default, unset others for this team
		if isDefault {
			if err := tx.Model(&domain.AIProviderConfig{}).
				Where("team_id = ?", teamID).
				Update("is_default", false).Error; err != nil {
				return err
			}
		}

		// Only update if the record exists
		result := tx.Model(&domain.AIProviderConfig{}).
			Where("team_id = ? AND provider_name = ?", teamID, providerName).
			Updates(map[string]interface{}{
				"model_name": modelName,
				"base_url":   baseURL,
				"is_default": isDefault,
			})
		return result.Error
	})
}

func (r *aiProviderRepository) GetDefaultConfig(ctx context.Context, teamID uuid.UUID) (*domain.AIProviderConfig, error) {
	var config domain.AIProviderConfig
	if err := r.db.WithContext(ctx).Where("team_id = ? AND is_default = ?", teamID, true).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil safely if no default found
		}
		return nil, err
	}
	return &config, nil
}
