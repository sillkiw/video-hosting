package videosapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/api/videos/dto"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
	"github.com/sillkiw/video-hosting/internal/videos"
)

func (vh *VideosHandler) get(w http.ResponseWriter, r *http.Request) {
	// TODO: complete response
	const op = "http.api.videos.get"
	l := vh.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	id := chi.URLParam(r, "video_id")
	ctx := r.Context()

	videoRec, err := vh.svc.Get(ctx, id)
	if err != nil {
		l.Info("failed to get video record",
			slog.String("id", id),
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	resp := dto.VideoResponse{
		ID:               videoRec.ID,
		Title:            videoRec.Title,
		Status:           videoRec.Status,
		CreatedAt:        videoRec.CreatedAt,
		UpdatedAt:        videoRec.UpdatedAt,
		OwnerDisplayName: videoRec.OwnerDisplayName,
	}

	if videoRec.Status == videos.StatusReady {
		resp.ManifestURL = "/media/videos/" + videoRec.ID + "/output.mpd"
		resp.ThumbnailURL = "/media/videos/" + videoRec.ID + "/thumb_" + videoRec.ID + ".jpeg"
	}

	httpjson.WriteJSON(w, r, http.StatusOK, resp)
}
