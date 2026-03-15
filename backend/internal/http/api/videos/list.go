package videosapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/api/videos/dto"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
)

func (vh *VideosHandler) list(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.videos.list"
	l := vh.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	ctx := r.Context()

	readyVideos, err := vh.svc.GetReadyVideos(ctx)
	if err != nil {
		l.Error("failed to get list of ready videos",
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	var resp dto.ListResponse
	for _, video := range readyVideos {
		resp.Items = append(resp.Items,
			dto.ListItem{
				ID:        video.ID,
				Title:     video.Title,
				CreatedAt: video.CreatedAt,
			},
		)
	}

	httpjson.WriteJSON(w, r, http.StatusOK, resp)
}
