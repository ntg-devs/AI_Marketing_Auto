package repository

import (
	"bityagi/internal/domain"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) domain.NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) ListByTeam(ctx context.Context, teamID uuid.UUID, limit, offset int) ([]domain.Notification, int64, error) {
	var ns []domain.Notification
	var total int64

	db := r.db.WithContext(ctx).Model(&domain.Notification{}).Where("team_id = ?", teamID)
	db.Count(&total)

	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&ns).Error
	return ns, total, err
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.Notification{}).Where("id = ?", id).Update("status", "read").Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, teamID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.Notification{}).Where("team_id = ?", teamID).Update("status", "read").Error
}

func (r *notificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Notification{}, "id = ?", id).Error
}
