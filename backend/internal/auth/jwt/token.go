package jwt

import (
	"fmt"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

type TokenManager interface {
	NewToken(userID, email, role string) (string, error)
	Parse(tokenString string) (*Claims, error)
}

type Manager struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

func New(secret string, ttl time.Duration, issuer string) *Manager {
	return &Manager{
		secret: []byte(secret),
		ttl:    ttl,
		issuer: issuer,
	}
}

func (m *Manager) NewToken(userID, email, role string) (string, error) {
	now := time.Now()

	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwtlib.NewNumericDate(now),
			NotBefore: jwtlib.NewNumericDate(now),
			ExpiresAt: jwtlib.NewNumericDate(now.Add(m.ttl)),
			Issuer:    m.issuer,
		},
	}

	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims)

	return token.SignedString(m.secret)
}

func (m *Manager) Parse(tokenString string) (*Claims, error) {
	token, err := jwtlib.ParseWithClaims(tokenString, &Claims{}, func(token *jwtlib.Token) (any, error) {
		if token.Method != jwtlib.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}
