package task

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"bityagi/pkg/mail"
	"github.com/hibiken/asynq"
)

type TaskProcessor interface {
	Start() error
	ProcessTaskGenerateContent(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendWelcomeEmail(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server *asynq.Server
	mailer *mail.SMTPSender
}

func NewRedisTaskProcessor(redisOpt asynq.RedisConnOpt, mailer *mail.SMTPSender) TaskProcessor {
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)
	return &RedisTaskProcessor{
		server: server,
		mailer: mailer,
	}
}

func (p *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeGenerateContent, p.ProcessTaskGenerateContent)
	mux.HandleFunc(TypeSendWelcomeEmail, p.ProcessTaskSendWelcomeEmail)

	return p.server.Run(mux)
}

func (p *RedisTaskProcessor) ProcessTaskGenerateContent(ctx context.Context, t *asynq.Task) error {
	var payload GenerateContentPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	// TODO: Integrate OpenAI/Gemini here
	log.Printf("Worker: Generating AI content for user %s with prompt: %s\n", payload.UserID, payload.Prompt)

	return nil
}

func (p *RedisTaskProcessor) ProcessTaskSendWelcomeEmail(ctx context.Context, t *asynq.Task) error {
	var payload SendWelcomeEmailPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("could not decode payload: %w", err)
	}

	if payload.OTP != "" {
		log.Printf("Worker: Sending OTP email to %s (%s). OTP Code: %s\n", payload.UserEmail, payload.FullName, payload.OTP)
		
		// Render HTML body
		htmlBody, err := mail.GenerateOTPTemplate(payload.FullName, payload.OTP)
		if err != nil {
			return fmt.Errorf("could not generate OTP template: %w", err)
		}

		// Send email if mailer is configured
		if p.mailer != nil && p.mailer.Host != "" {
			err = p.mailer.SendEmail([]string{payload.UserEmail}, "Verify your AetherFlow account", htmlBody)
			if err != nil {
				return fmt.Errorf("could not send SMTP email: %w", err)
			}
			log.Println("Worker: SMTP Email successfully delivered.")
		} else {
			log.Println("Worker: SMTP is not configured. Email bypassed.")
		}

	} else {
		log.Printf("Worker: Sending welcome email to %s (%s)\n", payload.UserEmail, payload.FullName)
		// For welcome emails without OTP...
	}

	return nil
}
