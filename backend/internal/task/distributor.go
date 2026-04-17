package task

import (
	"context"

	"github.com/hibiken/asynq"
)

type TaskDistributor interface {
	DistributeTaskGenerateContent(
		ctx context.Context,
		payload *GenerateContentPayload,
		opts ...asynq.Option,
	) error
	DistributeTaskSendWelcomeEmail(
		ctx context.Context,
		payload *SendWelcomeEmailPayload,
		opts ...asynq.Option,
	) error
	DistributeTaskCrawlSourceURL(
		ctx context.Context,
		payload *CrawlSourceURLPayload,
		opts ...asynq.Option,
	) error
	DistributeTaskAnalyzeImageURL(
		ctx context.Context,
		payload *AnalyzeImageURLPayload,
		opts ...asynq.Option,
	) error
}

type RedisTaskDistributor struct {
	client *asynq.Client
}

func NewRedisTaskDistributor(redisOpt asynq.RedisConnOpt) TaskDistributor {
	client := asynq.NewClient(redisOpt)
	return &RedisTaskDistributor{
		client: client,
	}
}

func (d *RedisTaskDistributor) DistributeTaskGenerateContent(
	ctx context.Context,
	payload *GenerateContentPayload,
	opts ...asynq.Option,
) error {
	jsonPayload, err := MarshalPayload(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeGenerateContent, jsonPayload, opts...)
	_, err = d.client.EnqueueContext(ctx, task)
	return err
}

func (d *RedisTaskDistributor) DistributeTaskSendWelcomeEmail(
	ctx context.Context,
	payload *SendWelcomeEmailPayload,
	opts ...asynq.Option,
) error {
	jsonPayload, err := MarshalPayload(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeSendWelcomeEmail, jsonPayload, opts...)
	_, err = d.client.EnqueueContext(ctx, task)
	return err
}

func (d *RedisTaskDistributor) DistributeTaskCrawlSourceURL(
	ctx context.Context,
	payload *CrawlSourceURLPayload,
	opts ...asynq.Option,
) error {
	jsonPayload, err := MarshalPayload(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeCrawlSourceURL, jsonPayload, opts...)
	_, err = d.client.EnqueueContext(ctx, task)
	return err
}

func (d *RedisTaskDistributor) DistributeTaskAnalyzeImageURL(
	ctx context.Context,
	payload *AnalyzeImageURLPayload,
	opts ...asynq.Option,
) error {
	jsonPayload, err := MarshalPayload(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeAnalyzeImageURL, jsonPayload, opts...)
	_, err = d.client.EnqueueContext(ctx, task)
	return err
}

