package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/sillkiw/video-hosting/internal/storage"
	"github.com/sillkiw/video-hosting/internal/videos"
)

func (s *Storage) Create(ctx context.Context, v videos.Video) (string, error) {
	const op = "storage.postgres.Create"
	const q = `
		INSERT INTO videos(title, video_size, video_status) 
		VALUES ($1, $2, $3)
		RETURNING id
	`
	var id string
	err := s.db.QueryRowContext(ctx, q, v.Title, v.Size, v.Status).Scan(&id)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return "", fmt.Errorf("%s: canceled: %w", op, err)
		}
		return "", fmt.Errorf("%s: insert: %w", op, err)
	}
	return id, nil
}

func (s *Storage) Get(ctx context.Context, id string) (videos.Video, error) {
	const op = "storage.postgres.Get"
	const q = `
		SELECT id, title, video_size, content_type, video_status, created_at, updated_at
		FROM videos
		WHERE id = $1
	`

	var vRec videos.Video

	err := s.db.QueryRowContext(ctx, q, id).Scan(
		&vRec.ID,
		&vRec.Title,
		&vRec.Size,
		&vRec.ContentType,
		&vRec.Status,
		&vRec.CreatedAt,
		&vRec.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return videos.Video{}, fmt.Errorf("%s: %w", op, storage.ErrIdNotFound)
		}
		return videos.Video{}, fmt.Errorf("%s: %w", op, err)
	}

	return vRec, nil
}

func (s *Storage) GetStatus(ctx context.Context, id string) (string, error) {
	const op = "storage.postgres.GetStatus"

	vRec, err := s.Get(ctx, id)
	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}
	return vRec.Status, nil
}

func (s *Storage) MarkNewStatus(ctx context.Context, id, prevStatus, newStatus string) error {
	const op = "storage.postgres.MarkUploading"
	const q = `
		UPDATE videos
		SET video_status = $2, updated_at = now()
		WHERE id = $1 AND video_status = $3
	`

	res, err := s.db.ExecContext(ctx, q, id, newStatus, prevStatus)
	if err != nil {
		return fmt.Errorf("%s: exec: %w", op, err)
	}

	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: rows_affected: %w", op, err)
	}
	if n == 1 {
		return nil
	}

	_, err = s.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return fmt.Errorf("%s: %w", op, storage.ErrConflict)
}

func (s *Storage) GetReadyVideos(ctx context.Context) ([]videos.Video, error) {
	const op = "storage.postgres.GetReadyVideos"
	const q = `
		SELECT id, title, created_at
		FROM videos
		WHERE video_status = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, q, videos.StatusReady)
	if err != nil {
		return nil, fmt.Errorf("%s: query: %w", op, err)
	}
	defer rows.Close()

	var items []videos.Video

	for rows.Next() {
		var v videos.Video

		err := rows.Scan(
			&v.ID,
			&v.Title,
			&v.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("%s: scan: %w", op, err)
		}

		items = append(items, v)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: rows: %w", op, err)
	}

	return items, nil
}

func (s *Storage) Close() error {
	return s.db.Close()
}
