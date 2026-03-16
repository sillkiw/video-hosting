package middleware

import (
	"net/http"
	"strings"

	authjwt "github.com/sillkiw/video-hosting/internal/auth/jwt"
	"github.com/sillkiw/video-hosting/internal/http/api/apierrors"
	"github.com/sillkiw/video-hosting/internal/http/httpjson"
)

func Auth(tokens authjwt.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				body := apierrors.New("unauthorized", "missing authorization header")
				httpjson.WriteJSON(w, r, http.StatusUnauthorized, body)
				return
			}

			const prefix = "Bearer "
			if !strings.HasPrefix(authHeader, prefix) {
				body := apierrors.New("unauthorized", "invalid authorization header")
				httpjson.WriteJSON(w, r, http.StatusUnauthorized, body)
				return
			}

			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, prefix))
			if tokenString == "" {
				body := apierrors.New("unauthorized", "missing bearer token")
				httpjson.WriteJSON(w, r, http.StatusUnauthorized, body)
				return
			}

			claims, err := tokens.Parse(tokenString)
			if err != nil {
				body := apierrors.New("unauthorized", "invalid or expired token")
				httpjson.WriteJSON(w, r, http.StatusUnauthorized, body)
				return
			}

			ctx := WithClaims(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
