package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/sillkiw/video-hosting/internal/processing"
	"github.com/sillkiw/video-hosting/internal/storage"
)

func (s *Storage) EnqueueTranscode(ctx context.Context, videoID string) error {
	const op = "storage.postgres.video_jobs.EnqueueTranscode"

	const q = `
		INSERT INTO video_jobs (video_id, job_type, status)
		VALUES ($1, $2, $3)
	`

	_, err := s.db.ExecContext(ctx, q, videoID, processing.JobTypeTranscode, processing.JobStatusPending)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) ClaimNextPending(ctx context.Context) (processing.Job, error) {
	const op = "storage.postgres.video_jobs.ClaimNextPending"

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return processing.Job{}, fmt.Errorf("%s: begin tx: %w", op, err)
	}
	defer tx.Rollback()

	const selectQ = `
		SELECT id, video_id, job_type, status, attempts, error_message, created_at, started_at, finished_at
		FROM video_jobs
		WHERE status = $1
		ORDER BY created_at
		FOR UPDATE SKIP LOCKED
		LIMIT 1
	`

	var job processing.Job
	var errMsg sql.NullString
	var startedAt, finishedAt sql.NullTime
	var jobType, jobStatus string

	err = tx.QueryRowContext(ctx, selectQ, processing.JobStatusPending).Scan(
		&job.ID,
		&job.VideoID,
		&jobType,
		&jobStatus,
		&job.Attempts,
		&errMsg,
		&job.CreatedAt,
		&startedAt,
		&finishedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return processing.Job{}, storage.ErrNoJobs
		}
		return processing.Job{}, fmt.Errorf("%s: select job: %w", op, err)
	}

	job.Type = processing.JobType(jobType)
	job.Status = processing.JobStatus(jobStatus)

	if errMsg.Valid {
		job.ErrorMessage = errMsg.String
	}
	if startedAt.Valid {
		t := startedAt.Time
		job.StartedAt = &t
	}
	if finishedAt.Valid {
		t := finishedAt.Time
		job.FinishedAt = &t
	}

	const updateQ = `
		UPDATE video_jobs
		SET status = $2,
		    attempts = attempts + 1,
		    started_at = NOW(),
		    error_message = NULL
		WHERE id = $1
	`

	_, err = tx.ExecContext(ctx, updateQ, job.ID, processing.JobStatusProcessing)
	if err != nil {
		return processing.Job{}, fmt.Errorf("%s: update job: %w", op, err)
	}

	if err := tx.Commit(); err != nil {
		return processing.Job{}, fmt.Errorf("%s: commit tx: %w", op, err)
	}

	job.Status = processing.JobStatusProcessing
	job.Attempts++

	return job, nil
}

func (s *Storage) MarkJobDone(ctx context.Context, jobID string) error {
	const op = "storage.postgres.video_jobs.MarkJobDone"

	const q = `
		UPDATE video_jobs
		SET status = $2,
		    finished_at = NOW(),
		    error_message = NULL
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, q, jobID, processing.JobStatusDone)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) MarkJobFailed(ctx context.Context, jobID string, errMsg string) error {
	const op = "storage.postgres.video_jobs.MarkJobFailed"

	const q = `
		UPDATE video_jobs
		SET status = $2,
		    finished_at = NOW(),
		    error_message = $3
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, q, jobID, processing.JobStatusFailed, errMsg)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}
