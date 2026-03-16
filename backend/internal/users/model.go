package users

import "time"

type User struct {
	ID           string
	Email        string
	PasswordHash string
	DisplayName  string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

const (
	RoleUser string = "user"
)
