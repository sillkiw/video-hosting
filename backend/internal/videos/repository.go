package videos

import "context"

type Repository interface {
	CreateVideo(ctx context.Context, v Video) (string, error)
	Get(ctx context.Context, id string) (Video, error)
	GetStatus(ctx context.Context, id string) (string, error)
	GetReadyVideos(ctx context.Context) ([]Video, error)
	MarkNewStatus(ctx context.Context, id string, prevStatus, newStatus string) error
}
