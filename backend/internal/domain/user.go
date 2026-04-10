package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email           string    `json:"email" gorm:"unique;not null"`
	FullName        string    `json:"full_name"`
	AvatarURL       string    `json:"avatar_url"`
	Role            string    `json:"role" gorm:"default:user"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	Provider        string    `json:"provider" gorm:"default:	"`
	EmailVerifiedAt *time.Time    `json:"email_verified_at"`
	CreatedAt       time.Time     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time     `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserCredentials struct {
	UserID       uuid.UUID `gorm:"primaryKey"`
	PasswordHash string
	OTPCode      string
	OTPExpiresAt *time.Time
	LastLoginAt  *time.Time
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

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" validate:"required"`
}

type VerifyOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
	OTP   string `json:"otp" validate:"required"`
}

type AuthResponse struct {
	User  *User  `json:"user,omitempty"`
	Token string `json:"token,omitempty"`
	Message string `json:"message,omitempty"`
	RequireOTP bool `json:"require_otp,omitempty"`
}

// Interfaces define how layers talk to each other without knowing implementation details.

type UserRepository interface {
	Create(ctx context.Context, user *User, creds *UserCredentials) error
	Update(ctx context.Context, user *User) error
	UpdateCredentials(ctx context.Context, creds *UserCredentials) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetCredentials(ctx context.Context, userID uuid.UUID) (*UserCredentials, error)
}

type UserService interface {
	Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error)
	VerifyEmailOTP(ctx context.Context, req *VerifyOTPRequest) (*AuthResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)
	GoogleLogin(ctx context.Context, req *GoogleLoginRequest) (*AuthResponse, error)
}
