package config

import (
	"log"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	Env        string           `yaml:"mode" env:"MODE" env-default:"dev"`
	Server     Server           `yaml:"server"`
	Upload     UploadConfig     `yaml:"upload"`
	Video      VideoConfig      `yaml:"video"`
	Validation ValidationConfig `yaml:"validation"`
	Auth       AuthConfig       `yaml:"auth"`
	DB         Postgres         `yaml:"db"`
}

type Postgres struct {
	DSN string `yaml:"url" env:"POSTGRES_URL"`
}

func MustLoad(configPath string) Config {
	_ = godotenv.Load()

	if _, err := os.Stat(configPath); err != nil {
		log.Fatalf("config file does not exist: %s", configPath)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		log.Fatalf("failed to read config: %v", err)
	}

	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Fatal("cannot read env: ", err)
	}

	if cfg.DB.DSN == "" {
		log.Fatal("POSTGRES_URL is required")
	}
	return cfg

}
