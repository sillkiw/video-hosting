package videosapi

import (
	"github.com/go-chi/chi/v5"

	authjwt "github.com/sillkiw/video-hosting/internal/auth/jwt"
	"github.com/sillkiw/video-hosting/internal/http/middleware"
)

func (vh *VideosHandler) NewRouter(tokens authjwt.TokenManager) *chi.Mux {
	videosRouter := chi.NewRouter()

	videosRouter.Get("/{video_id}", vh.get)
	videosRouter.Get("/", vh.list)

	videosRouter.Group(func(pr chi.Router) {
		pr.Use(middleware.Auth(tokens))
		pr.Post("/create", vh.create)
		pr.Put("/{video_id}/upload", vh.upload)
	})

	return videosRouter
}
