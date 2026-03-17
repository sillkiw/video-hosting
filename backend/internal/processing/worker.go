package processing

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
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

func (w *Worker) Run(ctx context.Context, concurrency int) error {
	if concurrency <= 0 {
		concurrency = 1
	}

	var wg sync.WaitGroup
	errCh := make(chan error, concurrency)

	for i := 0; i < concurrency; i++ {
		workerID := i + 1

		wg.Add(1)
		go func() {
			defer wg.Done()

			if err := w.runLoop(ctx, workerID); err != nil && !errors.Is(err, context.Canceled) {
				errCh <- fmt.Errorf("worker %d: %w", workerID, err)
			}
		}()
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-ctx.Done():
		<-done
		return ctx.Err()
	case err := <-errCh:
		return err
	case <-done:
		return nil
	}
}

func (w *Worker) runLoop(ctx context.Context, workerID int) error {
	const idleDelay = 2 * time.Second

	logger := w.logger.With(slog.Int("worker_id", workerID))

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		job, err := w.queue.ClaimNextPending(ctx)
		if err != nil {
			if errors.Is(err, storage.ErrNoJobs) {
				select {
				case <-ctx.Done():
					return ctx.Err()
				case <-time.After(idleDelay):
				}
				continue
			}

			logger.Error("failed to claim job", slog.Any("err", err))

			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(idleDelay):
			}
			continue
		}

		logger.Info(
			"claimed job",
			slog.String("job_id", job.ID),
			slog.String("video_id", job.VideoID),
		)

		if err := w.handleJob(ctx, job); err != nil {
			logger.Error(
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
