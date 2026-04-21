package main

import (
	"bityagi/internal/domain"
	"bityagi/internal/repository"
	"bityagi/internal/task"
	"bityagi/pkg/crawlerclient"
	"bityagi/pkg/mail"
	"bityagi/pkg/vertexsearch"
	"log"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=ai_marketing_auto port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Database connection initialized successfully
	db.AutoMigrate(
		&domain.CrawlJob{},
		&domain.CrawlPage{},
		&domain.KnowledgeSource{},
	)
	// Initialize Mailer Config
	mailer := mail.NewSMTPSender(
		os.Getenv("SMTP_HOST"),
		os.Getenv("SMTP_PORT"),
		os.Getenv("SMTP_USERNAME"),
		os.Getenv("SMTP_PASSWORD"),
		os.Getenv("SMTP_FROM"),
	)

	crawlRepo := repository.NewCrawlRepository(db)
	aiRepo := repository.NewAIProviderRepository(db)
	crawlerAPIURL := os.Getenv("CRAWLER_API_URL")
	crawlerSvc := crawlerclient.New(crawlerAPIURL)

	// Initialize Vertex AI Search Client if configured
	var vertexSvc vertexsearch.Client
	vertexProjectID := os.Getenv("VERTEX_AI_PROJECT_ID")
	vertexDataStoreID := os.Getenv("VERTEX_AI_DATA_STORE_ID")
	if vertexProjectID != "" && vertexDataStoreID != "" {
		cfg := vertexsearch.Config{
			ProjectID:       vertexProjectID,
			Location:        os.Getenv("VERTEX_AI_LOCATION"),
			CollectionID:    os.Getenv("VERTEX_AI_COLLECTION_ID"),
			DataStoreID:     vertexDataStoreID,
			ServingConfigID: os.Getenv("VERTEX_AI_SERVING_CONFIG_ID"),
			CredentialsFile: os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"),
		}
		var vErr error
		vertexSvc, vErr = vertexsearch.New(cfg)
		if vErr != nil {
			log.Printf("Warning: Failed to initialize Vertex AI Search: %v", vErr)
		} else {
			log.Println("Vertex AI Search integrated successfully")
		}
	} else {
		log.Println("Vertex AI Search is not configured (missing VERTEX_AI_PROJECT_ID or VERTEX_AI_DATA_STORE_ID)")
	}

	redisOpt := asynq.RedisClientOpt{Addr: redisAddr}
	processor := task.NewRedisTaskProcessor(redisOpt, mailer, crawlRepo, aiRepo, crawlerSvc, vertexSvc)

	log.Printf("Worker server starting on Redis %s...", redisAddr)
	if err := processor.Start(); err != nil {
		log.Fatalf("could not start task processor: %v", err)
	}
}
