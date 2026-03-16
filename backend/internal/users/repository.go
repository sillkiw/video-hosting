package users

import "context"

type Repository interface {
	CreateUser(ctx context.Context, u User) (string, error)
	GetByEmail(ctx context.Context, email string) (User, error)
	GetByID(ctx context.Context, id string) (User, error)
}
