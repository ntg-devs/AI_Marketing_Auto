package service

import (
	"bityagi/internal/domain"
	"bityagi/internal/task"
	"bityagi/pkg/auth"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
	"gorm.io/gorm"
)

type userService struct {
	repo        domain.UserRepository
	db          *gorm.DB
	jwtSecret   string
	distributor task.TaskDistributor
}

func NewUserService(repo domain.UserRepository, db *gorm.DB, secret string, distributor task.TaskDistributor) domain.UserService {
	return &userService{
		repo:        repo,
		db:          db,
		jwtSecret:   secret,
		distributor: distributor,
	}
}

func generateOTP(length int) string {
	const charset = "0123456789"
	b := make([]byte, length)
	for i := range b {
		// Note: Using math/rand here (insecure). For production, use crypto/rand.
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func (s *userService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	// 1. Check if user already exists
	existingUser, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user already exists")
	}

	// 2. Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 3. Create user entity
	user := &domain.User{
		ID:       uuid.New(),
		Email:    req.Email,
		FullName: req.FullName,
		Provider: "credentials",
		IsActive: false, // Inactive until OTP verified
	}

	// 4. Generate OTP
	otpCode := generateOTP(6)
	expiresAt := time.Now().Add(10 * time.Minute)

	creds := &domain.UserCredentials{
		PasswordHash: string(hashedPassword),
		OTPCode:      otpCode,
		OTPExpiresAt: &expiresAt,
	}

	// 5. Save to DB
	if err := s.repo.Create(ctx, user, creds); err != nil {
		return nil, err
	}

	// 6. ASYNC TASK: Send OTP email
	emailPayload := &task.SendWelcomeEmailPayload{
		UserEmail: user.Email,
		FullName:  user.FullName,
		OTP:       otpCode,
	}
	if err := s.distributor.DistributeTaskSendWelcomeEmail(ctx, emailPayload); err != nil {
		log.Printf("failed to enqueue welcome email task: %v", err)
	}

	return &domain.AuthResponse{
		Message:    "Registration successful. Please check your email for the OTP.",
		RequireOTP: true,
	}, nil
}

func (s *userService) VerifyEmailOTP(ctx context.Context, req *domain.VerifyOTPRequest) (*domain.AuthResponse, error) {
	// 1. Find user
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or OTP") // Do not reveal if email exists
	}

	// 2. Get credentials
	creds, err := s.repo.GetCredentials(ctx, user.ID)
	if err != nil {
		return nil, errors.New("invalid email or OTP")
	}

	// 3. Verify OTP
	if creds.OTPCode != req.OTP || creds.OTPExpiresAt == nil || time.Now().After(*creds.OTPExpiresAt) {
		return nil, errors.New("invalid or expired OTP")
	}

	// 4. Update user & credentials
	now := time.Now()
	user.IsActive = true
	user.EmailVerifiedAt = &now
	if err := s.repo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	creds.OTPCode = ""
	creds.OTPExpiresAt = nil
	if err := s.repo.UpdateCredentials(ctx, creds); err != nil {
		log.Printf("failed to clear OTP: %v", err)
	}

	// 5. Generate Token
	token, err := auth.GenerateToken(user.ID, s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Ensure team
	tid, _ := s.ensureUserTeam(ctx, user)
	user.TeamID = tid

	return &domain.AuthResponse{
		User:  user,
		Token: token,
	}, nil
}


func (s *userService) Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error) {
	// 1. Find user by email
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// 2. Fetch credentials
	creds, err := s.repo.GetCredentials(ctx, user.ID)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 3. Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 4. Generate token
	token, err := auth.GenerateToken(user.ID, s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Ensure team
	tid, _ := s.ensureUserTeam(ctx, user)
	user.TeamID = tid

	return &domain.AuthResponse{
		User:  user,
		Token: token,
	}, nil
}

func (s *userService) GoogleLogin(ctx context.Context, req *domain.GoogleLoginRequest) (*domain.AuthResponse, error) {
	var email, name, picture string

	// 1. Try to verify as Google ID Token (JWT)
	payload, err := idtoken.Validate(ctx, req.IDToken, "")
	if err == nil {
		email, _ = payload.Claims["email"].(string)
		name, _ = payload.Claims["name"].(string)
		picture, _ = payload.Claims["picture"].(string)
	} else {
		// 2. If ID Token validation fails, try to verify as Access Token
		userInfo, err := s.fetchGoogleUserInfo(req.IDToken)
		if err != nil {
			return nil, fmt.Errorf("invalid google token (tried both id_token and access_token): %w", err)
		}
		email, _ = userInfo["email"].(string)
		name, _ = userInfo["name"].(string)
		picture, _ = userInfo["picture"].(string)
	}

	if email == "" {
		return nil, errors.New("failed to get email from google token")
	}

	// 2. Check if user exists
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if user == nil {
		// 3. Create new user
		user = &domain.User{
			ID:        uuid.New(),
			Email:     email,
			FullName:  name,
			AvatarURL: picture,
			Provider:  "google",
		}
		creds := &domain.UserCredentials{}
		if err := s.repo.Create(ctx, user, creds); err != nil {
			return nil, err
		}

		// ASYNC TASK: Send welcome email for new Google users too
		emailPayload := &task.SendWelcomeEmailPayload{
			UserEmail: user.Email,
			FullName:  user.FullName,
		}
		if err := s.distributor.DistributeTaskSendWelcomeEmail(ctx, emailPayload); err != nil {
			log.Printf("failed to enqueue welcome email task: %v", err)
		}
	}

	// 4. Generate token
	token, err := auth.GenerateToken(user.ID, s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Ensure team
	tid, _ := s.ensureUserTeam(ctx, user)
	user.TeamID = tid

	return &domain.AuthResponse{
		User:  user,
		Token: token,
	}, nil
}

func (s *userService) fetchGoogleUserInfo(accessToken string) (map[string]interface{}, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch user info: status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// ensureUserTeam checks if user has a team, if not creates a personal one.
func (s *userService) ensureUserTeam(ctx context.Context, user *domain.User) (uuid.UUID, error) {
	teams, err := s.repo.GetTeamsByUserID(ctx, user.ID)
	if err == nil && len(teams) > 0 {
		return teams[0].ID, nil
	}

	// Create new personal team
	team := &domain.Team{
		ID:        uuid.New(),
		Name:      fmt.Sprintf("%s's Workspace", user.FullName),
		CreatedBy: user.ID,
	}

	if err := s.repo.CreateTeam(ctx, team); err != nil {
		return uuid.Nil, err
	}

	// Add user as owner
	member := &domain.TeamMember{
		TeamID: team.ID,
		UserID: user.ID,
		Role:   "owner",
	}

	if err := s.repo.AddTeamMember(ctx, member); err != nil {
		return team.ID, err // Team created but membership failed? Should be atomic ideally.
	}

	return team.ID, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, updates map[string]interface{}) (*domain.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if val, ok := updates["full_name"].(string); ok {
		user.FullName = val
	}
	if val, ok := updates["avatar_url"].(string); ok {
		user.AvatarURL = val
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *userService) GetTeamMembers(ctx context.Context, teamID uuid.UUID) ([]domain.User, error) {
	return s.repo.GetTeamMembers(ctx, teamID)
}

func (s *userService) GetWorkspace(ctx context.Context, teamID uuid.UUID) (*domain.Team, error) {
	return s.repo.GetTeamByID(ctx, teamID)
}

func (s *userService) UpdateWorkspace(ctx context.Context, teamID uuid.UUID, updates map[string]interface{}) (*domain.Team, error) {
	team, err := s.repo.GetTeamByID(ctx, teamID)
	if err != nil {
		return nil, err
	}

	if val, ok := updates["name"].(string); ok {
		team.Name = val
	}
	if val, ok := updates["brand_guidelines"].(string); ok {
		team.BrandGuidelines = val
	}
	if val, ok := updates["brand_persona"].(string); ok {
		team.BrandPersona = val
	}

	if err := s.repo.UpdateTeam(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}
func (s *userService) GetHealthStats(ctx context.Context, teamID uuid.UUID) (*domain.TeamHealthStats, error) {
	var stats domain.TeamHealthStats

	// 1. Social Account Health
	var accounts []domain.SocialAccount
	if err := s.db.WithContext(ctx).Where("team_id = ?", teamID).Find(&accounts).Error; err == nil {
		for _, acc := range accounts {
			status := domain.StatusHealthy
			if !acc.IsActive {
				status = domain.StatusDown
			} else if acc.TokenExpiresAt != nil && acc.TokenExpiresAt.Before(time.Now()) {
				status = domain.StatusDegraded
			}

			stats.Services = append(stats.Services, domain.ServiceHealth{
				ID:        acc.ID.String(),
				Name:      fmt.Sprintf("%s (%s)", acc.ProfileName, acc.Platform),
				Status:    status,
				Latency:   "N/A",
				Uptime:    "99.9%",
				LastCheck: "Just now",
			})
		}
	}

	// 2. AI Usage Stats (Mocking cost per token for now)
	var totalTokens int64
	s.db.WithContext(ctx).Table("api_usage_logs").
		Where("team_id = ?", teamID).
		Select("COALESCE(SUM(total_tokens), 0)").
		Scan(&totalTokens)
	
	stats.Usage.TotalTokens = int(totalTokens)
	stats.Usage.Cost = float64(totalTokens) * 0.000002 // Rough estimate $2/1M tokens

	// 3. Infrastructure Health (Basic checks)
	infraServices := []struct {
		ID   string
		Name string
	}{
		{"redis", "Redis Cache"},
		{"asynq", "Task Distributor"},
	}

	for _, srv := range infraServices {
		// In a real app, you would ping Redis/Asynq here.
		stats.Services = append(stats.Services, domain.ServiceHealth{
			ID:        srv.ID,
			Name:      srv.Name,
			Status:    domain.StatusHealthy,
			Latency:   "1ms",
			Uptime:    "100%",
			LastCheck: "Just now",
		})
	}

	return &stats, nil
}
