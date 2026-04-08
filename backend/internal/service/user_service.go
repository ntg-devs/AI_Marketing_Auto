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

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

type userService struct {
	repo        domain.UserRepository
	jwtSecret   string
	distributor task.TaskDistributor
}

func NewUserService(repo domain.UserRepository, secret string, distributor task.TaskDistributor) domain.UserService {
	return &userService{
		repo:        repo,
		jwtSecret:   secret,
		distributor: distributor,
	}
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
	}

	creds := &domain.UserCredentials{
		PasswordHash: string(hashedPassword),
	}

	// 4. Save to DB
	if err := s.repo.Create(ctx, user, creds); err != nil {
		return nil, err
	}

	// 5. Generate token (real logic)
	token, err := auth.GenerateToken(user.ID, s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// 6. ASYNC TASK: Send welcome email (Event-Driven)
	emailPayload := &task.SendWelcomeEmailPayload{
		UserEmail: user.Email,
		FullName:  user.FullName,
	}
	if err := s.distributor.DistributeTaskSendWelcomeEmail(ctx, emailPayload); err != nil {
		// We log the error but don't fail the registration because the user is already created
		log.Printf("failed to enqueue welcome email task: %v", err)
	}

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
