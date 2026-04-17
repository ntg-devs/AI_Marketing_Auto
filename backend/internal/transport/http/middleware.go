package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/auth"
	"bityagi/pkg/response"
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

func AuthMiddleware(jwtSecret string, userRepo domain.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, http.StatusUnauthorized, "missing authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				response.Error(w, http.StatusUnauthorized, "invalid authorization header format")
				return
			}

			claims, err := auth.ValidateToken(parts[1], jwtSecret)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			// Load user and inject into context
			userID, _ := uuid.Parse(claims.Subject)
			user, err := userRepo.GetByID(r.Context(), userID)
			if err != nil || user == nil {
				response.Error(w, http.StatusUnauthorized, "user not found")
				return
			}

			// Ensure TeamID for multi-tenant isolation
			teams, _ := userRepo.GetTeamsByUserID(r.Context(), user.ID)
			if len(teams) > 0 {
				user.TeamID = teams[0].ID
			}

			ctx := context.WithValue(r.Context(), "user", user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
