package authapi

import (
	"net/http"

	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/api/auth/dto"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
	"github.com/sillkiw/video-hosting/internal/http/middleware"
)

func (au *AuthHandler) me(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserID(r.Context())
	if !ok {
		body := apierrors.New("unauthorized", "missing auth context")
		httpjson.WriteJSON(w, r, http.StatusUnauthorized, body)
		return
	}

	user, err := au.svc.GetByID(r.Context(), userID)
	if err != nil {
		status, body := apierrors.Map(err)
		httpjson.WriteJSON(w, r, status, body)
		return
	}

	resp := dto.MeResponse{
		ID:          user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Role:        user.Role,
	}

	httpjson.WriteJSON(w, r, http.StatusOK, resp)
}
