package videos

import "context"

type Repo interface {
	Create(ctx context.Context, v Video) (string, error)
	Get(ctx context.Context, id string) (Video, error)
	GetStatus(ctx context.Context, id string) (string, error)
	MarkNewStatus(ctx context.Context, id, prevStatus, newStatus string) error
}
