package users

import (
	"context"
	"fmt"
	"strings"

	"github.com/sillkiw/video-hosting/internal/auth/jwt"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo   Repository
	tokens jwt.TokenManager
}

func New(repo Repository, tokens jwt.TokenManager) *Service {
	return &Service{repo: repo, tokens: tokens}
}

func (s *Service) Register(ctx context.Context, email, password, displayName string) (User, string, error) {
	const op = "users.Register"

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, "", fmt.Errorf("%s: generate hash: %w", op, err)
	}

	email = strings.ToLower(strings.TrimSpace(email))
	displayName = strings.TrimSpace(displayName)

	newUser := User{
		Email:        email,
		PasswordHash: string(hash),
		DisplayName:  displayName,
		Role:         RoleUser,
	}

	id, err := s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return User{}, "", fmt.Errorf("%s: create: %w", op, err)
	}
	newUser.ID = id

	token, err := s.tokens.NewToken(newUser.ID, newUser.Email, newUser.Role)
	if err != nil {
		return User{}, "", fmt.Errorf("%s: token: %w", op, err)
	}
	return newUser, token, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (User, string, error) {
	const op = "users.Login"

	email = strings.ToLower(strings.TrimSpace(email))

	u, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return User{}, "", fmt.Errorf("%s: get by email: %w", op, err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return User{}, "", fmt.Errorf("%s: compare password: invalid cred", op)
	}

	token, err := s.tokens.NewToken(u.ID, u.Email, u.Role)
	if err != nil {
		return User{}, "", fmt.Errorf("%s: token: %w", op, err)
	}

	return u, token, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	const op = "users.GetByID"

	id = strings.TrimSpace(id)
	if id == "" {
		return User{}, fmt.Errorf("%s: empty id", op)
	}

	u, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return User{}, fmt.Errorf("%s: get by id: %w", op, err)
	}

	return u, nil
}
