package authapi

import (
	"github.com/go-chi/chi/v5"
	"github.com/sillkiw/video-hosting/internal/auth/jwt"
	"github.com/sillkiw/video-hosting/internal/http/middleware"
)

func (au *AuthHandler) NewRouter(tokens jwt.TokenManager) *chi.Mux {
	r := chi.NewRouter()

	r.Post("/register", au.register)
	r.Post("/login", au.login)

	r.Group(func(pr chi.Router) {
		pr.Use(middleware.Auth(tokens))
		pr.Get("/me", au.me)
	})

	return r
}
