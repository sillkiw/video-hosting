package processing

import (
	"context"
	"time"
)

type JobType string
type JobStatus string

const (
	JobTypeTranscode JobType = "transcode"
)

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusDone       JobStatus = "done"
	JobStatusFailed     JobStatus = "failed"
)

type Job struct {
	ID           string
	VideoID      string
	Type         JobType
	Status       JobStatus
	Attempts     int
	ErrorMessage string
	CreatedAt    time.Time
	StartedAt    *time.Time
	FinishedAt   *time.Time
}

type JobQueue interface {
	ClaimNextPending(ctx context.Context) (Job, error)
	MarkJobDone(ctx context.Context, jobID string) error
	MarkJobFailed(ctx context.Context, jobID string, errMsg string) error
}
