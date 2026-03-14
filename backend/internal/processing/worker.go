package processing

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/sillkiw/video-hosting/internal/storage"
	"github.com/sillkiw/video-hosting/internal/videos"
)

type Worker struct {
	logger    *slog.Logger
	repo      VideosRepository
	queue     JobQueue
	processor Processor
}

func NewWorker(
	logger *slog.Logger,
	repo VideosRepository,
	queue JobQueue,
	processor Processor,
) *Worker {
	return &Worker{
		logger:    logger,
		repo:      repo,
		queue:     queue,
		processor: processor,
	}
}

func (w *Worker) Run(ctx context.Context) error {
	const idleDelay = 2 * time.Second

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		job, err := w.queue.ClaimNextPending(ctx)
		if err != nil {
			if errors.Is(err, storage.ErrNoJobs) {
				time.Sleep(idleDelay)
				continue
			}

			w.logger.Error("failed to claim job", slog.Any("err", err))
			time.Sleep(idleDelay)
			continue
		}

		if err := w.handleJob(ctx, job); err != nil {
			w.logger.Error(
				"failed to handle job",
				slog.String("job_id", job.ID),
				slog.String("video_id", job.VideoID),
				slog.Any("err", err),
			)
		}
	}
}

func (w *Worker) handleJob(ctx context.Context, job Job) error {
	if err := w.repo.MarkNewStatus(ctx, job.VideoID, videos.StatusUploaded, videos.StatusProcessing); err != nil {
		_ = w.queue.MarkJobFailed(ctx, job.ID, err.Error())
		return err
	}

	if err := w.processor.Process(ctx, job.VideoID); err != nil {
		_ = w.repo.MarkNewStatus(ctx, job.VideoID, videos.StatusProcessing, videos.StatusProcessingFailed)
		_ = w.queue.MarkJobFailed(ctx, job.ID, err.Error())
		return err
	}

	if err := w.repo.MarkNewStatus(ctx, job.VideoID, videos.StatusProcessing, videos.StatusReady); err != nil {
		_ = w.queue.MarkJobFailed(ctx, job.ID, err.Error())
		return err
	}

	if err := w.queue.MarkJobDone(ctx, job.ID); err != nil {
		return err
	}

	return nil
}
