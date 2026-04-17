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
	TeamID          uuid.UUID `json:"team_id,omitempty" gorm:"-"` // Added for API response
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	Provider        string    `json:"provider" gorm:"default:credentials"`
	EmailVerifiedAt *time.Time    `json:"email_verified_at"`
	CreatedAt       time.Time     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time     `json:"updated_at" gorm:"autoUpdateTime"`
}

type Team struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name            string    `json:"name" gorm:"not null"`
	BrandGuidelines string    `json:"brand_guidelines" gorm:"type:text"`
	BrandPersona    string    `json:"brand_persona" gorm:"type:text"`
	CreatedBy       uuid.UUID `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type TeamMember struct {
	TeamID uuid.UUID `gorm:"primaryKey;type:uuid"`
	UserID uuid.UUID `gorm:"primaryKey;type:uuid"`
	Role   string    `gorm:"default:'owner'"`
}

type UserCredentials struct {
	UserID       uuid.UUID `gorm:"primaryKey;column:user_id"`
	PasswordHash string    `gorm:"column:password_hash"`
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

	// Team operations
	CreateTeam(ctx context.Context, team *Team) error
	UpdateTeam(ctx context.Context, team *Team) error
	GetTeamByID(ctx context.Context, id uuid.UUID) (*Team, error)
	AddTeamMember(ctx context.Context, member *TeamMember) error
	GetTeamsByUserID(ctx context.Context, userID uuid.UUID) ([]Team, error)
	GetTeamMembers(ctx context.Context, teamID uuid.UUID) ([]User, error)
}

type UserService interface {
	Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error)
	VerifyEmailOTP(ctx context.Context, req *VerifyOTPRequest) (*AuthResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)
	GoogleLogin(ctx context.Context, req *GoogleLoginRequest) (*AuthResponse, error)
	
	// Account & Workspace
	UpdateProfile(ctx context.Context, userID uuid.UUID, updates map[string]interface{}) (*User, error)
	GetTeamMembers(ctx context.Context, teamID uuid.UUID) ([]User, error)
	GetWorkspace(ctx context.Context, teamID uuid.UUID) (*Team, error)
	UpdateWorkspace(ctx context.Context, teamID uuid.UUID, updates map[string]interface{}) (*Team, error)
	GetHealthStats(ctx context.Context, teamID uuid.UUID) (*TeamHealthStats, error)
}

type ServiceStatus string

const (
	StatusHealthy  ServiceStatus = "healthy"
	StatusDegraded ServiceStatus = "degraded"
	StatusDown     ServiceStatus = "down"
)

type ServiceHealth struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Status    ServiceStatus `json:"status"`
	Latency   string        `json:"latency"`
	Uptime    string        `json:"uptime"`
	LastCheck string        `json:"lastCheck"`
}

type TeamHealthStats struct {
	Services []ServiceHealth `json:"services"`
	Usage    struct {
		TotalTokens int     `json:"total_tokens"`
		Cost        float64 `json:"cost"`
	} `json:"usage"`
}
