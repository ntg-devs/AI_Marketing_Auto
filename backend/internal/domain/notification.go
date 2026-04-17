package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	TeamID    uuid.UUID  `json:"team_id" gorm:"type:uuid;not null;index"`
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
	Type      string     `json:"type" gorm:"type:varchar(50);not null"`
	Title     string     `json:"title" gorm:"not null"`
	Message   string     `json:"message" gorm:"not null"`
	Status    string     `json:"status" gorm:"type:varchar(20);default:'unread'"`
	LinkURL   string     `json:"link_url,omitempty"`
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Notification) TableName() string { return "notifications" }

type NotificationRepository interface {
	Create(ctx context.Context, n *Notification) error
	ListByTeam(ctx context.Context, teamID uuid.UUID, limit, offset int) ([]Notification, int64, error)
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllAsRead(ctx context.Context, teamID uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
}
