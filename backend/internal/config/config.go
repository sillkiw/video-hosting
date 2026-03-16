package config

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	Env        string
	Server     Server
	Upload     UploadConfig
	Video      VideoConfig
	Validation ValidationConfig
	DB         Postgres
	Auth       AuthConfig
}

type fileConfig struct {
	Server     Server           `yaml:"server"`
	Upload     UploadConfig     `yaml:"upload"`
	Video      VideoConfig      `yaml:"video"`
	Validation ValidationConfig `yaml:"validation"`
}

type Postgres struct {
	DSN string
}

type appEnv struct {
	Env string `env:"APP_ENV" env-default:"dev"`
}

type dbEnv struct {
	Host         string `env:"DB_HOST" env-required:"true"`
	Port         string `env:"DB_PORT" env-required:"true"`
	Name         string `env:"DB_NAME" env-required:"true"`
	User         string `env:"DB_USER" env-required:"true"`
	PasswordFile string `env:"DB_PASSWORD_FILE" env-required:"true"`
}

type authEnv struct {
	JWTSecret string        `env:"JWT_SECRET" env-required:"true"`
	JWTTTL    time.Duration `env:"JWT_TTL" env-default:"15m"`
	JWTIssuer string        `env:"JWT_ISSUER" env-default:"video-hosting-api"`
}

func MustLoad(configPath string) Config {
	if _, err := os.Stat(configPath); err != nil {
		log.Fatalf("config file does not exist: %s", configPath)
	}

	if err := godotenv.Load(); err != nil {
		log.Printf("dotenv not loaded: %v", err)
	}

	var fc fileConfig
	if err := cleanenv.ReadConfig(configPath, &fc); err != nil {
		log.Fatalf("failed to read config: %v", err)
	}

	var appCfg appEnv
	if err := cleanenv.ReadEnv(&appCfg); err != nil {
		log.Fatalf("cannot parse app env: %v", err)
	}

	var dbCfg dbEnv
	if err := cleanenv.ReadEnv(&dbCfg); err != nil {
		log.Fatalf("cannot parse db env: %v", err)
	}

	var authCfg authEnv
	if err := cleanenv.ReadEnv(&authCfg); err != nil {
		log.Fatalf("cannot parse auth env: %v", err)
	}

	pass, err := readSecretFile(dbCfg.PasswordFile)
	if err != nil {
		log.Fatalf("cannot read db password file: %v", err)
	}

	return Config{
		Env:        appCfg.Env,
		Server:     fc.Server,
		Upload:     fc.Upload,
		Video:      fc.Video,
		Validation: fc.Validation,
		DB: Postgres{
			DSN: buildPostgresDSN(dbCfg.Host, dbCfg.Port, dbCfg.Name, dbCfg.User, pass),
		},
		Auth: AuthConfig{
			JWTSecret: authCfg.JWTSecret,
			JWTTTL:    authCfg.JWTTTL,
			JWTIssuer: authCfg.JWTIssuer,
		},
	}
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
