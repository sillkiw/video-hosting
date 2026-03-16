package authapi

import (
	"log/slog"

	authvalidation "github.com/sillkiw/video-hosting/internal/http/api/auth/validation"
	"github.com/sillkiw/video-hosting/internal/users"
)

type AuthHandler struct {
	logger    *slog.Logger
	svc       *users.Service
	validator authvalidation.Validator
}

func New(logger *slog.Logger, svc *users.Service, v authvalidation.Validator) *AuthHandler {
	return &AuthHandler{logger: logger, svc: svc, validator: v}
}
