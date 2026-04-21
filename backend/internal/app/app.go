package app

import (
	"bityagi/internal/repository"
	"bityagi/internal/service"
	"bityagi/internal/task"
	"bityagi/internal/transport/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

type App struct {
	Router          *chi.Mux
	TaskDistributor task.TaskDistributor
}

func NewApp(db *gorm.DB, jwtSecret string, redisAddr string) *App {
	// 0. Messaging Infra (Event-Driven)
	redisOpt := asynq.RedisClientOpt{Addr: redisAddr}
	distributor := task.NewRedisTaskDistributor(redisOpt)

	// 1. Repository
	userRepo := repository.NewUserRepository(db)
	crawlRepo := repository.NewCrawlRepository(db)
	aiProviderRepo := repository.NewAIProviderRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	userPrefsRepo := repository.NewUserPreferencesRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	postRepo := repository.NewPostRepository(db)

	// 2. Service
	userService := service.NewUserService(userRepo, db, jwtSecret, distributor)
	crawlService := service.NewCrawlService(crawlRepo, distributor)
	scheduleService := service.NewScheduleService(scheduleRepo, notificationRepo)

	// 3. Handlers
	userHandler := http.NewUserHandler(userService)
	crawlHandler := http.NewCrawlHandler(crawlService)
	aiProviderHandler := http.NewAIProviderHandler(aiProviderRepo)
	contentHandler := http.NewContentHandler(aiProviderRepo, crawlRepo, postRepo)
	scheduleHandler := http.NewScheduleHandler(scheduleService)
	userPrefsHandler := http.NewUserPreferencesHandler(userPrefsRepo)
	notificationHandler := http.NewNotificationHandler(notificationRepo)
	postHandler := http.NewPostHandler(postRepo)

	// 4. Router Setup
	r := chi.NewRouter()

	// 4.1 CORS Middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 5. Build Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", userHandler.Register)
		r.Post("/auth/login", userHandler.Login)
		r.Post("/auth/verify-otp", userHandler.VerifyOTP)
		r.Post("/auth/google", userHandler.GoogleLogin)
		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(http.AuthMiddleware(jwtSecret, userRepo))
			
			// Profile & Account
			r.Put("/users/profile", userHandler.UpdateProfile)
			r.Get("/teams/members", userHandler.GetTeamMembers)
			r.Get("/teams/workspace", userHandler.GetWorkspace)
			r.Put("/teams/workspace", userHandler.UpdateWorkspace)
			r.Get("/teams/health", userHandler.GetHealthStats)

			r.Post("/research/url", crawlHandler.SubmitURL)
			r.Get("/research/live", crawlHandler.GetLiveResearch)
			r.Get("/research/jobs", crawlHandler.ListJobs)
			r.Get("/research/jobs/{jobID}", crawlHandler.GetJob)
			r.Delete("/research/jobs/{jobID}", crawlHandler.DeleteJob)
			
			r.Post("/teams/{teamID}/ai-providers", aiProviderHandler.SaveConfig)
			r.Get("/teams/{teamID}/ai-providers", aiProviderHandler.GetConfigs)

			r.Post("/content/generate", contentHandler.GenerateContent)
			r.Post("/content/outline", contentHandler.GenerateOutline)
			r.Post("/content/auto-suggest", contentHandler.AutoSuggest)
			
			// Posts / History
			r.Get("/posts/history", postHandler.GetCampaignHistory)

			// Schedule & Publishing
			r.Post("/schedules", scheduleHandler.CreateSchedule)
			r.Get("/schedules", scheduleHandler.ListSchedules)
			r.Get("/schedules/{scheduleID}", scheduleHandler.GetSchedule)
			r.Put("/schedules/{scheduleID}", scheduleHandler.UpdateSchedule)
			r.Delete("/schedules/{scheduleID}", scheduleHandler.DeleteSchedule)
			r.Post("/schedules/publish-due", scheduleHandler.PublishDue)
			r.Get("/social-accounts", scheduleHandler.ListSocialAccounts)
			r.Post("/social-accounts", scheduleHandler.SaveSocialAccount)
			r.Delete("/social-accounts/{id}", scheduleHandler.DeleteSocialAccount)

			// User Preferences
			r.Get("/users/{userID}/preferences", userPrefsHandler.GetPreferences)
			r.Put("/users/{userID}/preferences", userPrefsHandler.SavePreferences)

			// Notifications
			r.Get("/notifications", notificationHandler.List)
			r.Put("/notifications/{id}/read", notificationHandler.MarkRead)
			r.Post("/notifications/mark-all-read", notificationHandler.MarkAllRead)
		})
	})

	return &App{
		Router:          r,
		TaskDistributor: distributor,
	}
}
