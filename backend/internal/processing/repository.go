package processing

import "context"

type VideosRepository interface {
	MarkNewStatus(ctx context.Context, id string, prevStatus, newStatus string) error
}
