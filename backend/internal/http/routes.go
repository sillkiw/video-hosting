package http

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/sillkiw/video-hosting/internal/auth/jwt"
	authapi "github.com/sillkiw/video-hosting/internal/http/api/auth"
	videosapi "github.com/sillkiw/video-hosting/internal/http/api/videos"
	mv "github.com/sillkiw/video-hosting/internal/http/middleware"
)

func NewRouter(logger *slog.Logger, vh *videosapi.VideosHandler, au *authapi.AuthHandler, tokens jwt.TokenManager, dashPath string) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(mv.Logger(logger))
	router.Use(middleware.URLFormat)

	router.Mount("/api/videos", vh.NewRouter(tokens))

	router.Mount("/api/auth", au.NewRouter(tokens))

	fileServer := http.FileServer(http.Dir(dashPath))
	router.Handle("/media/videos/*", http.StripPrefix("/media/videos/", fileServer))

	return router
}
