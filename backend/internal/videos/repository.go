package videos

import "context"

type VideosRepository interface {
	Create(ctx context.Context, v Video) (string, error)
	Get(ctx context.Context, id string) (Video, error)
	GetStatus(ctx context.Context, id string) (string, error)
	MarkNewStatus(ctx context.Context, id string, prevStatus, newStatus string) error
}
