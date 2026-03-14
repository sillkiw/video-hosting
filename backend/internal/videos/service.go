package videos

import (
	"context"
	"fmt"
	"io"
)

type Service struct {
	repo        VideosRepository
	queue       Enqueuer
	uploadStore UploadStore
}

func New(repo VideosRepository, queue Enqueuer, uploadStore UploadStore) *Service {
	return &Service{queue: queue, repo: repo, uploadStore: uploadStore}
}

func (s *Service) UploadRaw(ctx context.Context, id string, src io.Reader) (int64, error) {
	const op = "videos.Service.UploadSource"

	if err := s.markUploading(ctx, id); err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	n, err := s.uploadStore.SaveRaw(ctx, id, src)
	if err != nil {
		_ = s.markUploadFailed(ctx, id)
		return 0, fmt.Errorf("%s: save raw: %w", op, err)
	}

	// 1. validate MIME/signature
	// 2. ffprobe
	// 3. cleanup on failure

	if err := s.markUploaded(ctx, id); err != nil {
		_ = s.markUploadFailed(ctx, id)
		return 0, fmt.Errorf("%s: mark uploaded: %w", op, err)
	}

	if err := s.queue.EnqueueTranscode(ctx, id); err != nil {
		return 0, fmt.Errorf("%s: enqueue transcode: %w", op, err)
	}

	return n, nil
}

func (s *Service) markUploading(ctx context.Context, id string) error {
	return s.repo.MarkNewStatus(ctx, id, StatusCreated, StatusUploading)
}

func (s *Service) markUploadFailed(ctx context.Context, id string) error {
	return s.repo.MarkNewStatus(ctx, id, StatusUploading, StatusUploadFailed)
}

func (s *Service) markUploaded(ctx context.Context, id string) error {
	return s.repo.MarkNewStatus(ctx, id, StatusUploading, StatusUploaded)
}

func (s *Service) Create(ctx context.Context, v Video) (string, error) {
	const op = "videos.Service.Create"
	id, err := s.repo.Create(ctx, v)
	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}
	return id, nil
}

func (s *Service) Get(ctx context.Context, id string) (Video, error) {
	const op = "videos.Service.Get"
	var videoRec Video
	videoRec, err := s.repo.Get(ctx, id)
	if err != nil {
		return Video{}, fmt.Errorf("%s: %w", op, err)
	}
	return videoRec, nil
}

func (s *Service) GetStatus(ctx context.Context, id string) (string, error) {
	const op = "videos.Service.GetStatus"
	var status string
	status, err := s.repo.GetStatus(ctx, id)
	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}
	return status, nil
}
