package videosapi

import "github.com/go-chi/chi/v5"

func (vh *VideosHandler) NewRouter() *chi.Mux {
	videosRouter := chi.NewRouter()
	videosRouter.Post("/create", vh.create)
	videosRouter.Put("/{video_id}/upload", vh.upload)
	videosRouter.Get("/{video_id}", vh.status)
	videosRouter.Get("/", vh.list)

	return videosRouter
}
