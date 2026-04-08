package task

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

type TaskProcessor interface {
	Start() error
	ProcessTaskGenerateContent(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendWelcomeEmail(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server *asynq.Server
}

func NewRedisTaskProcessor(redisOpt asynq.RedisConnOpt) TaskProcessor {
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

	log.Printf("Worker: Sending welcome email to %s (%s)\n", payload.UserEmail, payload.FullName)

	return nil
}
