package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"
	"github.com/sillkiw/video-hosting/internal/storage"
	"github.com/sillkiw/video-hosting/internal/videos"
)

const uniqueViolationCode = "23505"

type Storage struct {
	db *sql.DB
}

func New(postgresSql string) (*Storage, error) {
	const op = "storage.postgres.New"

	db, err := sql.Open("postgres", postgresSql)
	if err != nil {
		return nil, fmt.Errorf("%s: open: %w", op, err)
	}

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("%s: ping: %w", op, err)
	}

	return &Storage{db: db}, nil
}

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
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == uniqueViolationCode {
			return "", fmt.Errorf("%s: insert: %w", op, storage.ErrTitleExists)
		}
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
		SELECT * 
		FROM videos
		WHERE id = $1 
	`
	var vRec videos.Video
	err := s.db.QueryRowContext(ctx, q, id).Scan(&vRec.ID, &vRec.Title, &vRec.Size, &vRec.Status)
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

func (s *Storage) Close() error {
	return s.db.Close()
}
