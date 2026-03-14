package disk

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type DiskStore struct {
	DashPath string
	RawPath  string
}

func New(dashPath string, rawPath string) DiskStore {
	return DiskStore{
		DashPath: dashPath,
		RawPath:  rawPath,
	}
}

func (ds DiskStore) SaveRaw(ctx context.Context, id string, src io.Reader) (int64, error) {
	const op = "DiskStore.SaveRaw"

	if err := os.MkdirAll(ds.RawPath, 0o755); err != nil {
		return 0, fmt.Errorf("%s: mkdir: %w", op, err)
	}

	finalPath := ds.GetRawPath(id)
	tmpPath := ds.tmpPathFor(id)

	f, err := os.Create(tmpPath)
	if err != nil {
		return 0, fmt.Errorf("%s: create tmp: %w", op, err)
	}

	n, err := io.Copy(f, src)
	closeErr := f.Close()
	if err != nil {
		return 0, fmt.Errorf("%s: copy: %w", op, err)
	}
	if closeErr != nil {
		_ = os.Remove(tmpPath)
		return 0, fmt.Errorf("%s: close: %w", op, closeErr)
	}

	if err := os.Rename(tmpPath, finalPath); err != nil {
		_ = os.Remove(tmpPath)
		return 0, fmt.Errorf("%s: rename: %w", op, err)
	}

	return n, nil
}

func (ds DiskStore) tmpPathFor(id string) string {
	return filepath.Join(ds.RawPath, id+".mp4.uploading")
}

func (ds DiskStore) GetRawPath(id string) string {
	return filepath.Join(ds.RawPath, id+".mp4")
}

func (ds DiskStore) GetDashPath(id string) string {
	return filepath.Join(ds.DashPath, id)
}
