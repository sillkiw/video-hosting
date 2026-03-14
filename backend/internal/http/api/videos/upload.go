package videosapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	apierrors "github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
)

func (vh *VideosHandler) upload(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.videos.upload"
	l := vh.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	id := chi.URLParam(r, "video_id")
	ctx := r.Context()

	max := vh.validator.Cfg.UplLimit.MaxSize
	if r.ContentLength > max {
		l.Info("content length longer than available",
			slog.String("id", id),
		)
		httpjson.WriteJSON(w, r, 413, apierrors.New("payload_too_large", "file too large"))
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, max)
	defer r.Body.Close()

	n, err := vh.svc.UploadRaw(ctx, id, r.Body)
	if err != nil {
		l.Error("cannot upload raw",
			slog.String("id", id),
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	l.Info("video file was saved",
		slog.String("id", id),
		slog.Int64("size", n),
	)

	w.WriteHeader(http.StatusNoContent)
}
