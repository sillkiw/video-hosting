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

	"github.com/sillkiw/video-hosting/internal/auth/jwt"
	"github.com/sillkiw/video-hosting/internal/config"
	"github.com/sillkiw/video-hosting/internal/filestore/disk"
	transport "github.com/sillkiw/video-hosting/internal/http"
	authapi "github.com/sillkiw/video-hosting/internal/http/api/auth"
	authvalidation "github.com/sillkiw/video-hosting/internal/http/api/auth/validation"
	videosapi "github.com/sillkiw/video-hosting/internal/http/api/videos"
	videosvalidation "github.com/sillkiw/video-hosting/internal/http/api/videos/validation"
	"github.com/sillkiw/video-hosting/internal/httpserver"
	"github.com/sillkiw/video-hosting/internal/media"
	"github.com/sillkiw/video-hosting/internal/processing"
	"github.com/sillkiw/video-hosting/internal/storage/postgres"
	"github.com/sillkiw/video-hosting/internal/users"
	"github.com/sillkiw/video-hosting/internal/videos"
)

type App struct {
	l            *slog.Logger
	db           io.Closer
	server       *httpserver.Server
	worker       *processing.Worker
	numThreading int
}

func New(logger *slog.Logger, errorLog *log.Logger, cfg config.Config) (*App, error) {
	const op = "app.New"

	a := &App{
		l: logger,
	}

	// init postgres storage
	storage, err := postgres.New(cfg.DB.DSN)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	a.db = storage

	// make easy to read
	videosRepo := storage
	usersRepo := storage
	jobEnqueuer := storage
	jobQueue := storage
	processingRepo := storage

	// auth service
	tokenManager := jwt.New(cfg.Auth.JWTSecret, cfg.Auth.JWTTTL, cfg.Auth.JWTIssuer)
	authSrv := users.New(usersRepo, tokenManager)

	// videos service
	diskStore := disk.New(cfg.Video.DashPath, cfg.Video.RawPath)
	videosSrv := videos.New(videosRepo, jobEnqueuer, diskStore)

	// handlers for videos api
	videosValidator := videosvalidation.New(cfg.Validation.Video)
	videosHandler := videosapi.New(logger, videosSrv, videosValidator)

	// handlers for auth api
	authValidator := authvalidation.New(cfg.Validation.Auth)
	authHandler := authapi.New(logger, authSrv, authValidator)

	// centralized handler
	mainHandler := transport.NewRouter(logger, videosHandler, authHandler, tokenManager, diskStore.DashPath)

	// init httpserver
	server := httpserver.New(errorLog, mainHandler, cfg.Server)
	a.server = server

	// media transcoder and worker for taking videos jobs from queue
	processor := media.New(&cfg, diskStore)
	a.worker = processing.NewWorker(logger, processingRepo, jobQueue, processor)

	a.numThreading = cfg.Video.Threads

	return a, nil
}

func (a *App) Run(ctx context.Context) error {
	go func() {
		if err := a.worker.Run(ctx, a.numThreading); err != nil && !errors.Is(err, context.Canceled) {
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
