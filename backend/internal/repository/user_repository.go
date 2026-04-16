package repository

import (
	"bityagi/internal/domain"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User, creds *domain.UserCredentials) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Create main User entry
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		// 2. Map UserID to Credentials and Create
		creds.UserID = user.ID
		if err := tx.Create(creds).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetCredentials(ctx context.Context, userID uuid.UUID) (*domain.UserCredentials, error) {
	var creds domain.UserCredentials
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&creds).Error; err != nil {
		return nil, err
	}
	return &creds, nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) UpdateCredentials(ctx context.Context, creds *domain.UserCredentials) error {
	return r.db.WithContext(ctx).Save(creds).Error
}

func (r *userRepository) CreateTeam(ctx context.Context, team *domain.Team) error {
	return r.db.WithContext(ctx).Create(team).Error
}

func (r *userRepository) AddTeamMember(ctx context.Context, member *domain.TeamMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *userRepository) GetTeamsByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Team, error) {
	var teams []domain.Team
	err := r.db.WithContext(ctx).
		Joins("JOIN team_members ON team_members.team_id = teams.id").
		Where("team_members.user_id = ?", userID).
		Find(&teams).Error
	return teams, err
}
