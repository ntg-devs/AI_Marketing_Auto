package app

import (
	"bityagi/internal/repository"
	"bityagi/internal/service"
	"bityagi/internal/task"
	"bityagi/internal/transport/http"

	"github.com/go-chi/chi/v5"
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

	// 2. Service
	userService := service.NewUserService(userRepo, jwtSecret, distributor)

	// 3. Handlers
	userHandler := http.NewUserHandler(userService)

	// 4. Router Setup
	r := chi.NewRouter()

	// 5. Build Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/register", userHandler.Register)
		r.Post("/login", userHandler.Login)
	})

	return &App{
		Router:          r,
		TaskDistributor: distributor,
	}
}
