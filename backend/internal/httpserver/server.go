package httpserver

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/sillkiw/video-hosting/internal/config"
)

type Server struct {
	errlog *log.Logger
	srv    *http.Server
}

func New(errlog *log.Logger, handler http.Handler, cfg config.Server) *Server {
	s := &Server{
		errlog: errlog,
	}

	s.srv = &http.Server{
		Addr:         cfg.HTTP.Addr,
		Handler:      handler,
		ErrorLog:     errlog,
		ReadTimeout:  cfg.HTTP.ReadTimeout,
		WriteTimeout: cfg.HTTP.WriteTimeout,
		IdleTimeout:  cfg.HTTP.IdleTimeout,
	}

	return s
}

func (s *Server) Start() error {
	const op = "httpserver.server.Start"
	if err := s.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.srv.Shutdown(ctx)
}
