package main

import (
	"bityagi/internal/task"
	"bityagi/pkg/mail"
	"log"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	// Initialize Mailer Config
	mailer := mail.NewSMTPSender(
		os.Getenv("SMTP_HOST"),
		os.Getenv("SMTP_PORT"),
		os.Getenv("SMTP_USERNAME"),
		os.Getenv("SMTP_PASSWORD"),
		os.Getenv("SMTP_FROM"),
	)

	redisOpt := asynq.RedisClientOpt{Addr: redisAddr}
	processor := task.NewRedisTaskProcessor(redisOpt, mailer)

	log.Printf("Worker server starting on Redis %s...", redisAddr)
	if err := processor.Start(); err != nil {
		log.Fatalf("could not start task processor: %v", err)
	}
}
