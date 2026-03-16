package authapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"

	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/api/auth/dto"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
)

func (au *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.auth.login"

	l := au.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	var req dto.LoginRequest

	err := render.DecodeJSON(r.Body, &req)
	if err != nil {
		l.Info("failed to decode request body",
			slog.Any("err", err),
		)
		body := apierrors.New("failed_decode_json", "failed to decode request body")
		httpjson.WriteJSON(w, r, http.StatusBadRequest, body)
		return
	}

	l.Debug("request was decoded",
		slog.String("email", req.Email),
	)

	if verrs := au.validator.LoginRequest(req); !verrs.Empty() {
		l.Info("failed to validate request",
			slog.Any("err", verrs),
		)
		status, body := apierrors.Map(verrs)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	user, token, err := au.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		l.Info("failed to login user",
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	l.Info("user logged in",
		slog.String("id", user.ID),
	)

	resp := dto.LoginResponse{
		Token: token,
		User: dto.LoginUser{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			Role:        user.Role,
		},
	}

	httpjson.WriteJSON(w, r, http.StatusOK, resp)
}
