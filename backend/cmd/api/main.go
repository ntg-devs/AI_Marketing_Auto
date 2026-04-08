package main

import (
	"bityagi/internal/app"
	"bityagi/internal/domain"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 0. Load Environment Variables (.env)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// 1. Connection String
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=ai_marketing_auto port=5432 sslmode=disable"
	}

	// 2. Initialize DB
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 2.1 Auto Migrate Models
	log.Println("Running database migrations...")
	err = db.AutoMigrate(&domain.User{}, &domain.UserCredentials{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// 3. Environment Configs
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "very-secret-key"
	}

	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	application := app.NewApp(db, jwtSecret, redisAddr)

	// 4. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, application.Router); err != nil {
		log.Fatal(err)
	}
}
