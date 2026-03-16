package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/sillkiw/video-hosting/internal/storage"
	"github.com/sillkiw/video-hosting/internal/users"
)

/*
type Repository interface {
	CreateUser(ctx context.Context, u User) (string, error)
	GetByEmail(ctx context.Context, email string) (User, error)
	GetByID(ctx context.Context, id string) (User, error)
}

*/

func (s *Storage) CreateUser(ctx context.Context, u users.User) (string, error) {
	const op = "storage.postgres.users.CreateUser"
	const q = `
		INSERT INTO users(email, password_hash, display_name, role) 
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	var id string
	err := s.db.QueryRowContext(ctx, q, u.Email, u.PasswordHash, u.DisplayName, u.Role).Scan(&id)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return "", fmt.Errorf("%s: canceled: %w", op, err)
		}
		return "", fmt.Errorf("%s: insert: %w", op, err)
	}
	return id, nil
}

func (s *Storage) GetByEmail(ctx context.Context, email string) (users.User, error) {
	const op = "storage.postgres.users.GetByEmail"
	const q = `
		SELECT id, email, password_hash, display_name, role, created_at, updated_at
		FROM users
		WHERE email=$1
	`

	var u users.User

	err := s.db.QueryRowContext(ctx, q, email).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.DisplayName,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return users.User{}, fmt.Errorf("%s: %w", op, storage.ErrEmailNotFound)
		}
		return users.User{}, fmt.Errorf("%s: %w", op, err)
	}

	return u, nil
}

func (s *Storage) GetByID(ctx context.Context, user_id string) (users.User, error) {
	const op = "storage.postgres.users.GetByID"
	const q = `
		SELECT id, email, password_hash, display_name, role, created_at, updated_at
		FROM users
		WHERE id=$1
	`

	var u users.User

	err := s.db.QueryRowContext(ctx, q, user_id).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.DisplayName,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return users.User{}, fmt.Errorf("%s: %w", op, storage.ErrUserIDNotFound)
		}
		return users.User{}, fmt.Errorf("%s: %w", op, err)
	}

	return u, nil
}
