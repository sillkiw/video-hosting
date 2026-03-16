package config

import "time"

type AuthConfig struct {
	JWTSecret string        `env:"JWT_SECRET" env-required:"true"`
	JWTTTL    time.Duration `env:"JWT_TTL" env-default:"15m"`
	JWTIssuer string        `env:"JWT_ISSUER" env-default:"video-hosting-api"`
}
