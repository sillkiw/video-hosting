package videos

import (
	"context"
	"fmt"
	"io"

	"github.com/sillkiw/video-hosting/internal/videos"
)

type Service struct {
	repo      Repo
	fileStore FileStore
}

func New(repo Repo, fileStore FileStore) *Service {
	return &Service{repo: repo, fileStore: fileStore}
}

func (s *Service) Create(ctx context.Context, v Video) (string, error) {
	const op = "videos.Service.Create"
	id, err := s.repo.Create(v)
	if err != nil {
		return "", fmt.Errorf("%s: create: %w", op, err)
	}
	return id, nil
}

func (s *Service) Get(ctx context.Context, id string) (Video, error) {
	const op = "videos.Service.Get"
	var videoRec Video
	videoRec, err := s.repo.Get(id)
	if err != nil {
		return Video{}, fmt.Errorf("%s: get: %w", op, err)
	}
	return videoRec, nil
}

func (s *Service) SaveRaw(ctx context.Context, id string, src io.Reader) (int64, error) {
	const op = "videos.Service.SaveRaw"
	n, err := s.fileStore.SaveRaw(ctx, id, src)
	if err != nil {
		return -1, fmt.Errorf("%s: get: %w", op, err)
	}
	return n, nil
}

func (s *Service) MarkUploading(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploading"
	err := s.repo.ChangeStatus(ctx, id, videos.StatusUploading)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Service) MarkUploadFailed(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploadFailed"
	err := s.repo.ChangeStatus(ctx, id, videos.StatusUploadFailed)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Service) MarkUploaded(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploaded"
	err := s.repo.ChangeStatus(id, videos.StatusUploaded)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}
