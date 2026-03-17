package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/sillkiw/video-hosting/internal/storage"
	"github.com/sillkiw/video-hosting/internal/videos"
)

func (s *Storage) CreateVideo(ctx context.Context, v videos.Video) (string, error) {
	const op = "storage.postgres.videos.CreateVideo"
	const q = `
		INSERT INTO videos(owner_id, title, video_size, content_type, video_status) 
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	var id string
	err := s.db.QueryRowContext(
		ctx,
		q,
		v.OwnerID,
		v.Title,
		v.Size,
		v.ContentType,
		v.Status,
	).Scan(&id)

	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return "", fmt.Errorf("%s: canceled: %w", op, err)
		}
		return "", fmt.Errorf("%s: insert: %w", op, err)
	}

	return id, nil
}

func (s *Storage) Get(ctx context.Context, videoID string) (videos.Video, error) {
	const op = "storage.postgres.videos.Get"
	const q = `
		SELECT
			v.id,
			v.owner_id,
			u.display_name,
			v.title,
			v.video_size,
			v.content_type,
			v.video_status,
			v.created_at,
			v.updated_at
		FROM videos v
		JOIN users u ON u.id = v.owner_id
		WHERE v.id = $1
	`

	var vRec videos.Video

	err := s.db.QueryRowContext(ctx, q, videoID).Scan(
		&vRec.ID,
		&vRec.OwnerID,
		&vRec.OwnerDisplayName,
		&vRec.Title,
		&vRec.Size,
		&vRec.ContentType,
		&vRec.Status,
		&vRec.CreatedAt,
		&vRec.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return videos.Video{}, fmt.Errorf("%s: %w", op, storage.ErrVideoIDNotFound)
		}
		return videos.Video{}, fmt.Errorf("%s: %w", op, err)
	}

	return vRec, nil
}

func (s *Storage) GetStatus(ctx context.Context, videoID string) (string, error) {
	const op = "storage.postgres.videos.GetStatus"

	vRec, err := s.Get(ctx, videoID)
	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}

	return vRec.Status, nil
}

func (s *Storage) MarkNewStatus(ctx context.Context, videoID, prevStatus, newStatus string) error {
	const op = "storage.postgres.videos.MarkUploading"
	const q = `
		UPDATE videos
		SET video_status = $2, updated_at = now()
		WHERE id = $1 AND video_status = $3
	`

	res, err := s.db.ExecContext(ctx, q, videoID, newStatus, prevStatus)
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

	_, err = s.Get(ctx, videoID)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return fmt.Errorf("%s: %w", op, storage.ErrConflict)
}

func (s *Storage) GetReadyVideos(ctx context.Context) ([]videos.Video, error) {
	const op = "storage.postgres.videos.GetReadyVideos"
	const q = `
		SELECT
			v.id,
			v.owner_id,
			u.display_name,
			v.title,
			v.video_size,
			v.content_type,
			v.video_status,
			v.created_at,
			v.updated_at
		FROM videos v
		JOIN users u ON u.id = v.owner_id
		WHERE v.video_status = $1
		ORDER BY v.created_at DESC
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
			&v.OwnerID,
			&v.OwnerDisplayName,
			&v.Title,
			&v.Size,
			&v.ContentType,
			&v.Status,
			&v.CreatedAt,
			&v.UpdatedAt,
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
