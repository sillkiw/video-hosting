package videos

import (
	"context"
	"io"
)

type FileStore interface {
	SaveRaw(ctx context.Context, id string, scr io.Reader) (int64, error)
}
