package videos

import "context"

type Enqueuer interface {
	EnqueueTranscode(ctx context.Context, videoID string) error
}
