package middleware

import (
	"context"

	authjwt "github.com/sillkiw/video-hosting/internal/auth/jwt"
)

type contextKey string

const claimsKey contextKey = "auth_claims"

func WithClaims(ctx context.Context, claims *authjwt.Claims) context.Context {
	return context.WithValue(ctx, claimsKey, claims)
}

func Claims(ctx context.Context) (*authjwt.Claims, bool) {
	claims, ok := ctx.Value(claimsKey).(*authjwt.Claims)
	return claims, ok
}

func UserID(ctx context.Context) (string, bool) {
	claims, ok := Claims(ctx)
	if !ok || claims == nil {
		return "", false
	}
	return claims.UserID, true
}

func Role(ctx context.Context) (string, bool) {
	claims, ok := Claims(ctx)
	if !ok || claims == nil {
		return "", false
	}
	return claims.Role, true
}
