package videosvalidation

import (
	"github.com/sillkiw/video-hosting/internal/config"
)

type Validator struct {
	Cfg config.ValidationConfig
}

func New(cfg config.ValidationConfig) Validator {
	return Validator{Cfg: cfg}
}
