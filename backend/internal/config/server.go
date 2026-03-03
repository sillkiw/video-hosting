package config

import "time"

type HTTP struct {
	Addr         string        `env:"SERVER_ADDR"`
	ReadTimeout  time.Duration `yaml:"read_timeout"  env:"READ_TIMEOUT"  env-default:"10s"`
	WriteTimeout time.Duration `yaml:"write_timeout" env:"WRITE_TIMEOUT" env-default:"10s"`
	IdleTimeout  time.Duration `yaml:"idle_timeout"  env:"IDLE_TIMEOUT"  env-default:"60s"`
}

type Server struct {
	HTTP HTTP `yaml:"http"`
}
