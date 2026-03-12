package videos

import (
	"context"
	"fmt"
	"io"
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

func (s *Service) SaveRaw(ctx context.Context, id string, src io.Reader) (int64, error) {
	const op = "videos.Service.SaveRaw"
	n, err := s.fileStore.SaveRaw(ctx, id, src)
	if err != nil {
		return -1, fmt.Errorf("%s:  %w", op, err)
	}
	return n, nil
}

func (s *Service) MarkUploading(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploading"
	err := s.repo.MarkNewStatus(ctx, id, StatusCreated, StatusUploading)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Service) MarkUploadFailed(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploadFailed"
	err := s.repo.MarkNewStatus(ctx, id, StatusUploading, StatusUploadFailed)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Service) MarkUploaded(ctx context.Context, id string) error {
	const op = "videos.Service.MarkUploaded"
	err := s.repo.MarkNewStatus(ctx, id, StatusUploading, StatusUploaded)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}
