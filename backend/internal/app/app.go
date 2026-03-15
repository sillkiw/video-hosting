package app

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"time"

	"github.com/sillkiw/video-hosting/internal/config"
	"github.com/sillkiw/video-hosting/internal/filestore/disk"
	transport "github.com/sillkiw/video-hosting/internal/http"
	videosapi "github.com/sillkiw/video-hosting/internal/http/api/videos"
	videosvalidation "github.com/sillkiw/video-hosting/internal/http/api/videos/validation"
	"github.com/sillkiw/video-hosting/internal/httpserver"
	"github.com/sillkiw/video-hosting/internal/media"
	"github.com/sillkiw/video-hosting/internal/processing"
	"github.com/sillkiw/video-hosting/internal/storage/postgres"
	"github.com/sillkiw/video-hosting/internal/videos"
)

type App struct {
	l      *slog.Logger
	db     io.Closer
	server *httpserver.Server
	worker *processing.Worker
}

func New(logger *slog.Logger, errorLog *log.Logger, cfg config.Config) (*App, error) {
	const op = "app.New"

	a := &App{
		l: logger,
	}

	storage, err := postgres.New(cfg.DB.DSN)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	a.db = storage

	videoRepo := storage
	jobEnqueuer := storage
	jobQueue := storage
	processingRepo := storage

	diskStore := disk.New(cfg.Video.DashPath, cfg.Video.RawPath)

	videosSrv := videos.New(videoRepo, jobEnqueuer, diskStore)

	validator := videosvalidation.New(cfg.Validation)
	videosHandler := videosapi.New(logger, videosSrv, validator)

	mainHandler := transport.NewRouter(logger, videosHandler, diskStore.DashPath)

	server := httpserver.New(errorLog, mainHandler, cfg.Server)
	a.server = server

	processor := media.New(&cfg, diskStore)
	a.worker = processing.NewWorker(logger, processingRepo, jobQueue, processor)

	return a, nil
}

func (a *App) Run(ctx context.Context) error {
	go func() {
		if err := a.worker.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
			a.l.Error("worker stopped", slog.Any("err", err))
		}
	}()

	go func() {
		<-ctx.Done()

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := a.server.Shutdown(shutdownCtx); err != nil {
			a.l.Error("http shutdown failed", slog.Any("err", err))
		}
	}()

	if err := a.server.Start(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return nil
}
