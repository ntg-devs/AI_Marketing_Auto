package domain

import (
	"context"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email           string    `json:"email" gorm:"unique;not null"`
	FullName        string    `json:"full_name"`
	AvatarURL       string    `json:"avatar_url"`
	Role            string    `json:"role" gorm:"default:user"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	Provider        string    `json:"provider" gorm:"default:credentials"`
	EmailVerifiedAt *int64    `json:"email_verified_at"`
	CreatedAt       int64     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       int64     `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserCredentials struct {
	UserID       uuid.UUID `gorm:"primaryKey"`
	PasswordHash string
	OTPCode      string
	OTPExpiresAt *int64
	LastLoginAt  *int64
}

type RegisterRequest struct {
	FullName string `json:"full_name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	User  *User  `json:"user"`
	Token string `json:"token"`
}

// Interfaces define how layers talk to each other without knowing implementation details.

type UserRepository interface {
	Create(ctx context.Context, user *User, creds *UserCredentials) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetCredentials(ctx context.Context, userID uuid.UUID) (*UserCredentials, error)
}

type UserService interface {
	Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)
}
