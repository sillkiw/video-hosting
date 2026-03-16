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

func (au *AuthHandler) register(w http.ResponseWriter, r *http.Request) {
	const op = "http.api.auth.register"

	l := au.logger.With(
		slog.String("op", op),
		slog.String("request_id", middleware.GetReqID(r.Context())),
	)

	var req dto.RegisterRequest

	err := render.DecodeJSON(r.Body, &req)
	if err != nil {
		l.Info("failed to decode request body",
			slog.Any("err", err),
		)
		// TODO: more detailed json error response
		body := apierrors.New("failed_decode_json", "failed to decode request body")
		httpjson.WriteJSON(w, r, http.StatusBadRequest, body)
		return
	}

	if verrs := au.validator.RegisterRequest(req); !verrs.Empty() {
		l.Info("failed to validate request",
			slog.Any("err", verrs),
		)
		status, body := apierrors.Map(verrs)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	newUser, token, err := au.svc.Register(
		r.Context(),
		req.Email,
		req.Password,
		req.DisplayName,
	)
	if err != nil {
		l.Info("failed to register user",
			slog.Any("err", err),
		)
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}
	l.Info("user created",
		slog.String("id", newUser.ID),
		slog.String("email", newUser.Email),
	)

	resp := dto.RegisterResponse{
		Token: token,
		User: dto.RegisterUser{
			ID:          newUser.ID,
			Email:       newUser.Email,
			DisplayName: newUser.DisplayName,
			Role:        newUser.Role,
		},
	}
	httpjson.WriteJSON(w, r, http.StatusCreated, resp)

}
