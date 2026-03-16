package authvalidation

import (
	"github.com/sillkiw/video-hosting/internal/config"
)

type Validator struct {
	Cfg config.AuthValidationConfig
}

func New(cfg config.AuthValidationConfig) Validator {
	return Validator{Cfg: cfg}
}
