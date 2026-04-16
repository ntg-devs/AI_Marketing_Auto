package repository

import (
	"bityagi/internal/domain"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userPreferencesRepository struct {
	db *gorm.DB
}

func NewUserPreferencesRepository(db *gorm.DB) domain.UserPreferencesRepository {
	return &userPreferencesRepository{db: db}
}

func (r *userPreferencesRepository) Upsert(ctx context.Context, prefs *domain.UserPreferences) error {
	var existing domain.UserPreferences
	err := r.db.WithContext(ctx).Where("user_id = ?", prefs.UserID).First(&existing).Error

	if err == nil {
		// Update existing record — preserve ID
		prefs.ID = existing.ID
		return r.db.WithContext(ctx).Model(&existing).Updates(map[string]interface{}{
			"default_tone":             prefs.DefaultTone,
			"default_language":         prefs.DefaultLanguage,
			"default_content_length":   prefs.DefaultContentLength,
			"default_target_audience":  prefs.DefaultTargetAudience,
			"default_editor_mode":      prefs.DefaultEditorMode,
			"default_platform":         prefs.DefaultPlatform,
		}).Error
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new record
		return r.db.WithContext(ctx).Create(prefs).Error
	}

	return err
}

func (r *userPreferencesRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.UserPreferences, error) {
	var prefs domain.UserPreferences
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&prefs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No preferences saved yet — not an error
		}
		return nil, err
	}
	return &prefs, nil
}
