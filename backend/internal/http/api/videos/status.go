package videosapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/api/videos/dto"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
)

func (vh *VideosHandler) status(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.videos.status"
	l := vh.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	id := chi.URLParam(r, "video_id")
	ctx := r.Context()

	status, err := vh.svc.GetStatus(ctx, id)
	if err != nil {
		l.Info("failed to get status",
			slog.String("id", id),
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	resp := dto.StatusResponse{
		ID:     id,
		Status: status,
	}

	if status == "ready" {
		resp.Links = dto.LinksSt{
			DashManifest: "/api/videos/" + id + "/dash",
		}
	}

	httpjson.WriteJSON(w, r, http.StatusOK, resp)
}
