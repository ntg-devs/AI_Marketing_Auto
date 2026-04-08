package service

import (
	"bityagi/internal/domain"
	"bityagi/internal/task"
	"bityagi/pkg/auth"
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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
