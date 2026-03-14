package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/sillkiw/video-hosting/internal/app"
	"github.com/sillkiw/video-hosting/internal/config"
)

const (
	envDev  = "dev"
	envProd = "prod"
)

func main() {
	configPath := flag.String("config", "./configs/config.yaml", "Path to configuration file")
	flag.Parse()

	cfg := config.MustLoad(*configPath)
	logger, errorLog := setupLogger(cfg.Env)

	application, err := app.New(logger, errorLog, cfg)
	if err != nil {
		logger.Error("failed to init app", slog.Any("err", err))
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := application.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
		logger.Error("app stopped with error", slog.Any("err", err))
	}
}

func setupLogger(env string) (*slog.Logger, *log.Logger) {
	var handler slog.Handler

	switch env {
	case envDev:
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	case envProd:
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	default:
		handler = slog.NewTextHandler(os.Stdout, nil)
	}

	logger := slog.New(handler)
	errorLog := slog.NewLogLogger(handler, slog.LevelError)

	return logger, errorLog
}
