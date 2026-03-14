package processing

import "context"

type Processor interface {
	Process(ctx context.Context, videoID string) error
}
