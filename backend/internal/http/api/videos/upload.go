package videosapi

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	apierrors "github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
	authmw "github.com/sillkiw/video-hosting/internal/http/middleware"
)

func (vh *VideosHandler) upload(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.videos.upload"

	l := vh.logger.With(
		slog.String("op", op),
		slog.String("request_id", chimw.GetReqID(r.Context())),
	)

	userID, ok := authmw.UserID(r.Context())
	if !ok {
		l.Info("missing auth context")
		httpjson.WriteJSON(w, r, http.StatusUnauthorized, apierrors.New("unauthorized", "missing auth context"))
		return
	}

	id := chi.URLParam(r, "video_id")
	ctx := r.Context()

	video, err := vh.svc.Get(ctx, id)
	if err != nil {
		l.Info("failed to get video",
			slog.String("id", id),
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	if video.OwnerID != userID {
		l.Info("forbidden upload attempt",
			slog.String("id", id),
			slog.String("owner_id", video.OwnerID),
			slog.String("user_id", userID),
		)
		httpjson.WriteJSON(w, r, http.StatusForbidden, apierrors.New("forbidden", "you are not the owner of this video"))
		return
	}

	max := vh.validator.Cfg.Upload.MaxSize
	if r.ContentLength > max {
		l.Info("content length longer than available",
			slog.String("id", id),
		)
		httpjson.WriteJSON(w, r, http.StatusRequestEntityTooLarge, apierrors.New("payload_too_large", "file too large"))
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

		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			httpjson.WriteJSON(w, r, http.StatusRequestEntityTooLarge, apierrors.New("payload_too_large", "file too large"))
			return
		}

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
