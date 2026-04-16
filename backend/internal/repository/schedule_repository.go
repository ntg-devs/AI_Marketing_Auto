package repository

import (
	"bityagi/internal/domain"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type scheduleRepository struct {
	db *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) domain.ScheduleRepository {
	return &scheduleRepository{db: db}
}

// ─── Posts ────────────────────────────────────────────────────────

func (r *scheduleRepository) CreatePost(ctx context.Context, post *domain.Post) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *scheduleRepository) GetPostByID(ctx context.Context, id uuid.UUID) (*domain.Post, error) {
	var post domain.Post
	if err := r.db.WithContext(ctx).First(&post, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *scheduleRepository) UpdatePostStatus(ctx context.Context, id uuid.UUID, status string) error {
	updates := map[string]interface{}{"status": status}
	if status == domain.PostStatusPublished {
		now := time.Now()
		updates["published_at"] = &now
	}
	return r.db.WithContext(ctx).Model(&domain.Post{}).Where("id = ?", id).Updates(updates).Error
}

// ─── Publish Schedules ───────────────────────────────────────────

func (r *scheduleRepository) CreateSchedule(ctx context.Context, schedule *domain.PublishSchedule) error {
	return r.db.WithContext(ctx).Create(schedule).Error
}

func (r *scheduleRepository) GetScheduleByID(ctx context.Context, id uuid.UUID) (*domain.PublishSchedule, error) {
	var schedule domain.PublishSchedule
	err := r.db.WithContext(ctx).
		Preload("Post").
		Preload("SocialAccount").
		First(&schedule, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *scheduleRepository) ListSchedulesByTeam(ctx context.Context, teamID uuid.UUID, limit, offset int) (*domain.ScheduleListResponse, error) {
	var schedules []domain.PublishSchedule
	var total int64

	baseQuery := r.db.WithContext(ctx).
		Joins("JOIN posts ON posts.id = publish_schedules.post_id").
		Where("posts.team_id = ?", teamID)

	if err := baseQuery.Model(&domain.PublishSchedule{}).Count(&total).Error; err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 50
	}

	err := r.db.WithContext(ctx).
		Preload("Post").
		Preload("SocialAccount").
		Joins("JOIN posts ON posts.id = publish_schedules.post_id").
		Where("posts.team_id = ?", teamID).
		Order("publish_schedules.scheduled_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&schedules).Error
	if err != nil {
		return nil, err
	}

	return &domain.ScheduleListResponse{
		Schedules: schedules,
		Total:     total,
	}, nil
}

func (r *scheduleRepository) UpdateSchedule(ctx context.Context, id uuid.UUID, updates map[string]interface{}) error {
	return r.db.WithContext(ctx).
		Model(&domain.PublishSchedule{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *scheduleRepository) DeleteSchedule(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.PublishSchedule{}, "id = ?", id).Error
}

func (r *scheduleRepository) GetDueSchedules(ctx context.Context, before time.Time) ([]domain.PublishSchedule, error) {
	var schedules []domain.PublishSchedule
	err := r.db.WithContext(ctx).
		Preload("Post").
		Preload("SocialAccount").
		Where("status = ? AND scheduled_at <= ?", domain.ScheduleStatusScheduled, before).
		Order("scheduled_at ASC").
		Find(&schedules).Error
	return schedules, err
}

func (r *scheduleRepository) MarkSchedulePublished(ctx context.Context, id uuid.UUID, externalPostID, externalPostURL string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&domain.PublishSchedule{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":            domain.ScheduleStatusPublished,
			"published_at":      &now,
			"external_post_id":  externalPostID,
			"external_post_url": externalPostURL,
		}).Error
}

func (r *scheduleRepository) MarkScheduleFailed(ctx context.Context, id uuid.UUID, errorMsg string) error {
	return r.db.WithContext(ctx).
		Model(&domain.PublishSchedule{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        domain.ScheduleStatusFailed,
			"error_message": errorMsg,
			"retry_count":   gorm.Expr("retry_count + 1"),
		}).Error
}

// ─── Social Accounts ─────────────────────────────────────────────

func (r *scheduleRepository) GetSocialAccountByID(ctx context.Context, id uuid.UUID) (*domain.SocialAccount, error) {
	var account domain.SocialAccount
	if err := r.db.WithContext(ctx).First(&account, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *scheduleRepository) GetSocialAccountByPlatform(ctx context.Context, teamID uuid.UUID, platform string) (*domain.SocialAccount, error) {
	var account domain.SocialAccount
	err := r.db.WithContext(ctx).
		Where("team_id = ? AND platform = ? AND is_active = true", teamID, platform).
		First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

// EnsureSocialAccount finds or creates a placeholder social account for a givem team+platform.
// In production, this would require real OAuth tokens. For now, creates a placeholder to unblock scheduling.
func (r *scheduleRepository) EnsureSocialAccount(ctx context.Context, teamID uuid.UUID, platform string) (*domain.SocialAccount, error) {
	// Try to find existing
	existing, err := r.GetSocialAccountByPlatform(ctx, teamID, platform)
	if err == nil && existing != nil {
		return existing, nil
	}

	// Create placeholder account
	account := &domain.SocialAccount{
		TeamID:       teamID,
		Platform:     platform,
		AccessToken:  "placeholder_pending_oauth",
		ProfileName:  fmt.Sprintf("%s Account", strings.ToUpper(platform[:1])+platform[1:]),
		IsActive:     true,
	}
	if err := r.db.WithContext(ctx).Create(account).Error; err != nil {
		return nil, err
	}
	return account, nil
}
