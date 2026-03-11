package config

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	Env        string           `env:"APP_ENV" env-default:"dev"`
	Server     Server           `yaml:"server"`
	Upload     UploadConfig     `yaml:"upload"`
	Video      VideoConfig      `yaml:"video"`
	Validation ValidationConfig `yaml:"validation"`
	DB         Postgres
}

type Postgres struct {
	DSN string
}

type envDBParser struct {
	Host            string `env:"DB_HOST"`
	Port            string `env:"DB_PORT"`
	Name            string `env:"DB_NAME"`
	User            string `env:"DB_USER"`
	PasswordFilePth string `env:"DB_PASSWORD_FILE"`
}

func MustLoad(configPath string) Config {

	if _, err := os.Stat(configPath); err != nil {
		log.Fatalf("config file does not exist: %s", configPath)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		log.Fatalf("failed to read config: %v", err)
	}

	if err := godotenv.Load(); err != nil {
		log.Fatalf("cannot load .env: %v", err)
	}
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Fatal("cannot read env: ", err)
	}

	var dbEnv envDBParser
	if err := cleanenv.ReadEnv(&dbEnv); err != nil {
		log.Fatal("cannot read db env: ", err)
	}

	pass, err := readSecretFile(dbEnv.PasswordFilePth)
	if err != nil {
		log.Fatal("cannot read db password file: ", err)
	}
	cfg.DB.DSN = buildPostgresDSN(dbEnv.Host, dbEnv.Port, dbEnv.Name, dbEnv.User, pass)
	return cfg

}

func readSecretFile(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read secret file %q: %w", path, err)
	}
	s := strings.TrimSpace(string(b))
	if s == "" {
		return "", errors.New("secret file is empty")
	}
	return s, nil
}

func buildPostgresDSN(host, port, dbname, user, password string) string {
	// postgresql://username:password@localhost:5432/database
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   fmt.Sprintf("%s:%s", host, port),
		Path:   dbname,
	}
	q := u.Query()
	q.Set("sslmode", "disable")
	u.RawQuery = q.Encode()
	return u.String()

}
