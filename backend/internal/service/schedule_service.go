package service

import (
	"bityagi/internal/domain"
	"bityagi/pkg/publisher"
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

// makeSlug creates a URL-safe slug from a title string.
func makeSlug(title string) string {
	s := strings.ToLower(title)
	// Replace non-alphanumeric characters with hyphens
	re := regexp.MustCompile(`[^a-z0-9]+`)
	s = re.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "post"
	}
	return s
}

// titleCase capitalizes the first letter of a string.
func titleCase(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

type scheduleService struct {
	repo domain.ScheduleRepository
	notifRepo domain.NotificationRepository
}

func NewScheduleService(repo domain.ScheduleRepository, notifRepo domain.NotificationRepository) domain.ScheduleService {
	return &scheduleService{repo: repo, notifRepo: notifRepo}
}

// CreateAndSchedule creates a Post + PublishSchedule in one operation.
func (s *scheduleService) CreateAndSchedule(ctx context.Context, req *domain.CreateScheduleRequest) (*domain.ScheduleDetailResponse, error) {
	// Parse IDs
	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		return nil, fmt.Errorf("invalid team_id: %w", err)
	}
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user_id: %w", err)
	}

	// Parse scheduled time
	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, fmt.Errorf("invalid scheduled_at format, expected RFC3339: %w", err)
	}

	if scheduledAt.Before(time.Now().Add(-1 * time.Minute)) {
		return nil, fmt.Errorf("scheduled_at must be in the future")
	}

	// Determine topic from title if not provided
	topic := req.Topic
	if topic == "" {
		topic = req.Title
	}

	// 1. Create the Post
	post := &domain.Post{
		TeamID:      teamID,
		UserID:      userID,
		Title:       req.Title,
		Slug:        makeSlug(req.Title) + "-" + uuid.New().String()[:8],
		Topic:       topic,
		ContentHTML: req.ContentHTML,
		Language:    "vi",
		Status:      domain.PostStatusScheduled,
	}

	if err := s.repo.CreatePost(ctx, post); err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	log.Printf("[Schedule Service] Created post %s for team %s", post.ID, teamID)

	// 2. Resolve Social Account
	var socialAccountID uuid.UUID
	if req.SocialAccountID != "" {
		socialAccountID, err = uuid.Parse(req.SocialAccountID)
		if err != nil {
			return nil, fmt.Errorf("invalid social_account_id: %w", err)
		}
	} else {
		// Auto-resolve: find or create social account for this platform
		platform := strings.ToLower(req.Platform)
		account, err := s.repo.EnsureSocialAccount(ctx, teamID, platform)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve social account: %w", err)
		}
		socialAccountID = account.ID
	}

	// 3. Create the PublishSchedule
	schedule := &domain.PublishSchedule{
		PostID:          post.ID,
		SocialAccountID: socialAccountID,
		ScheduledAt:     scheduledAt,
		Status:          domain.ScheduleStatusScheduled,
	}

	if err := s.repo.CreateSchedule(ctx, schedule); err != nil {
		return nil, fmt.Errorf("failed to create schedule: %w", err)
	}

	// 4. Create Notification
	_ = s.notifRepo.Create(ctx, &domain.Notification{
		TeamID:  teamID,
		UserID:  &userID,
		Type:    "publish",
		Title:   "Lịch đăng bài mới",
		Message: fmt.Sprintf("Bài viết '%s' đã được lên lịch đăng vào %s", post.Title, scheduledAt.Format("15:04 02/01")),
	})

	log.Printf("[Schedule Service] ✅ Scheduled post %s for %s at %s", post.ID, req.Platform, scheduledAt.Format(time.RFC3339))

	// Load relations for response
	loaded, err := s.repo.GetScheduleByID(ctx, schedule.ID)
	if err != nil {
		// Return what we have, it's already saved
		return &domain.ScheduleDetailResponse{
			Schedule: schedule,
			Post:     post,
		}, nil
	}

	return &domain.ScheduleDetailResponse{
		Schedule: loaded,
		Post:     loaded.Post,
	}, nil
}

func (s *scheduleService) GetSchedule(ctx context.Context, id uuid.UUID) (*domain.ScheduleDetailResponse, error) {
	schedule, err := s.repo.GetScheduleByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &domain.ScheduleDetailResponse{
		Schedule: schedule,
		Post:     schedule.Post,
	}, nil
}

func (s *scheduleService) ListSchedules(ctx context.Context, teamID uuid.UUID, limit, offset int) (*domain.ScheduleListResponse, error) {
	return s.repo.ListSchedulesByTeam(ctx, teamID, limit, offset)
}

func (s *scheduleService) UpdateSchedule(ctx context.Context, id uuid.UUID, req *domain.UpdateScheduleRequest) error {
	updates := make(map[string]interface{})

	if req.ScheduledAt != nil {
		t, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err != nil {
			return fmt.Errorf("invalid scheduled_at: %w", err)
		}
		updates["scheduled_at"] = t
	}

	if req.Status != nil {
		updates["status"] = *req.Status
		if *req.Status == domain.ScheduleStatusPublished {
			now := time.Now()
			updates["published_at"] = &now
		}
	}

	if len(updates) == 0 {
		return nil
	}

	return s.repo.UpdateSchedule(ctx, id, updates)
}

func (s *scheduleService) DeleteSchedule(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteSchedule(ctx, id)
}

// PublishDueSchedules finds all schedules past their scheduled_at and publishes them
// to the respective social platforms using real API calls.
func (s *scheduleService) PublishDueSchedules(ctx context.Context) (int, error) {
	due, err := s.repo.GetDueSchedules(ctx, time.Now())
	if err != nil {
		return 0, err
	}

	published := 0
	for _, schedule := range due {
		// 1. Mark as processing
		err := s.repo.UpdateSchedule(ctx, schedule.ID, map[string]interface{}{
			"status": domain.ScheduleStatusProcessing,
		})
		if err != nil {
			log.Printf("[Schedule Service] ⚠️ Failed to mark schedule %s as processing: %v", schedule.ID, err)
			continue
		}

		// 2. Load the SocialAccount to get credentials
		account := schedule.SocialAccount
		if account == nil {
			account, err = s.repo.GetSocialAccountByID(ctx, schedule.SocialAccountID)
			if err != nil {
				errMsg := fmt.Sprintf("Social account not found: %v", err)
				log.Printf("[Schedule Service] ⚠️ %s (schedule: %s)", errMsg, schedule.ID)
				_ = s.repo.MarkScheduleFailed(ctx, schedule.ID, errMsg)
				continue
			}
		}

		// 3. Load post content
		post := schedule.Post
		if post == nil {
			post, err = s.repo.GetPostByID(ctx, schedule.PostID)
			if err != nil {
				errMsg := fmt.Sprintf("Post not found: %v", err)
				_ = s.repo.MarkScheduleFailed(ctx, schedule.ID, errMsg)
				continue
			}
		}

		// 4. Get the platform publisher
		pub, err := publisher.GetPublisher(account.Platform)
		if err != nil {
			errMsg := fmt.Sprintf("Unsupported platform '%s': %v", account.Platform, err)
			_ = s.repo.MarkScheduleFailed(ctx, schedule.ID, errMsg)
			continue
		}

		// 5. Execute the publish
		log.Printf("[Schedule Service] 📤 Publishing schedule %s to %s (post: %s)...",
			schedule.ID, account.Platform, post.Title)

		result, err := pub.Publish(publisher.PublishOptions{
			AccessToken: account.AccessToken,
			PageID:      account.PageID,
			Title:       post.Title,
			ContentHTML: post.ContentHTML,
			ImageURL:    post.FeaturedImageURL,
		})

		if err != nil {
			errMsg := fmt.Sprintf("[%s] %v", account.Platform, err)
			log.Printf("[Schedule Service] ❌ Publish failed for schedule %s: %v", schedule.ID, err)
			_ = s.repo.MarkScheduleFailed(ctx, schedule.ID, errMsg)

			// Create failure notification
			teamID := post.TeamID
			_ = s.notifRepo.Create(ctx, &domain.Notification{
				TeamID:  teamID,
				Type:    "error",
				Title:   "Đăng bài thất bại",
				Message: fmt.Sprintf("Bài viết '%s' không thể đăng lên %s: %s", post.Title, titleCase(account.Platform), err.Error()),
			})
			continue
		}

		// 6. Mark as published with external references
		err = s.repo.MarkSchedulePublished(ctx, schedule.ID, result.ExternalPostID, result.ExternalPostURL)
		if err != nil {
			log.Printf("[Schedule Service] ⚠️ Published but failed to update DB for schedule %s: %v", schedule.ID, err)
			continue
		}

		// 7. Update post status
		_ = s.repo.UpdatePostStatus(ctx, schedule.PostID, domain.PostStatusPublished)

		// 8. Create success notification
		teamID := post.TeamID
		_ = s.notifRepo.Create(ctx, &domain.Notification{
			TeamID:  teamID,
			Type:    "success",
			Title:   "Đăng bài thành công",
			Message: fmt.Sprintf("Bài viết '%s' đã được đăng lên %s thành công!", post.Title, titleCase(account.Platform)),
		})

		published++
		log.Printf("[Schedule Service] ✅ Published schedule %s → %s (external: %s)",
			schedule.ID, account.Platform, result.ExternalPostID)
	}

	return published, nil
}

func (s *scheduleService) ListSocialAccounts(ctx context.Context, teamID uuid.UUID) ([]domain.SocialAccount, error) {
	return s.repo.ListSocialAccountsByTeam(ctx, teamID)
}

func (s *scheduleService) SaveSocialAccount(ctx context.Context, account *domain.SocialAccount) error {
	return s.repo.UpsertSocialAccount(ctx, account)
}

func (s *scheduleService) DeleteSocialAccount(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteSocialAccount(ctx, id)
}
