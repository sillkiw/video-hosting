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

	// v, err := vh.svc.Get(ctx, id)
	// if err != nil {
	// 	l.Info("failed to find video",
	// 		slog.String("id", id),
	// 		slog.Any("err", err),
	// 	)
	// 	status, body := apierrors.Map(err)
	// 	httpjson.WriteJSON(w, r, status, body)
	// 	return
	// }
	// if v.Status != videos.StatusCreated {
	// 	l.Info("wrong video status",
	// 		slog.String("id", id),
	// 		slog.String("status", string(v.Status)),
	// 	)
	// 	httpjson.WriteJSON(w, r, 409, apierrors.New("conflict", "upload not allowed"))
	// 	return
	// }

	max := vh.validator.Cfg.UplLimit.MaxSize
	if r.ContentLength > max {
		l.Info("content length longer than available",
			slog.String("id", id),
		)
		httpjson.WriteJSON(w, r, 413, apierrors.New("payload_too_large", "file too large"))
		return
	}

	if err := vh.svc.MarkUploading(ctx, id); err != nil {
		l.Error("cannot update video status", slog.String("id", id), slog.Any("err", err))
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, max)
	defer r.Body.Close()

	n, err := vh.svc.SaveRaw(ctx, id, r.Body)
	if err != nil {
		_ = vh.svc.MarkUploadFailed(ctx, id)
		l.Error("cannot save raw video",
			slog.String("id", id),
			slog.Any("err", err),
		)
		// TODO: need to make clever mapping
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	if err := vh.svc.MarkUploaded(ctx, id); err != nil {
		_ = vh.svc.MarkUploadFailed(ctx, id)
		l.Error("cannot update video status", slog.String("id", id), slog.Any("err", err))
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
