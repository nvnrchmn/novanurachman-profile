package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

type csrfEntry struct {
	token     string
	expiresAt time.Time
}

var (
	csrfMu      sync.Mutex
	csrfTokens  = make(map[string]*csrfEntry)
	csrfTimeout = 1 * time.Hour
)

// CSRF generates and validates CSRF tokens.
func CSRF() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if c.Method() == "GET" {
			// Generate new token for GET requests
			token := generateCSRFToken()
			csrfMu.Lock()
			csrfTokens[c.IP()] = &csrfEntry{
				token:     token,
				expiresAt: time.Now().Add(csrfTimeout),
			}
			csrfMu.Unlock()
			c.Cookie(&fiber.Cookie{
				Name:     "csrf_token",
				Value:    token,
				HTTPOnly: false,
				SameSite: "Lax",
				Expires:  time.Now().Add(csrfTimeout),
			})
			c.Locals("csrf_token", token)
			return c.Next()
		}

		// Validate token for POST/PUT/DELETE
		cookieToken := c.Cookies("csrf_token")
		headerToken := c.Get("X-CSRF-Token")

		if cookieToken == "" || headerToken == "" {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"message": "CSRF token missing",
			})
		}

		csrfMu.Lock()
		entry, exists := csrfTokens[c.IP()]
		csrfMu.Unlock()

		if !exists || time.Now().After(entry.expiresAt) {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"message": "CSRF token expired",
			})
		}

		if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 ||
			subtle.ConstantTimeCompare([]byte(entry.token), []byte(headerToken)) != 1 {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"message": "CSRF token invalid",
			})
		}

		return c.Next()
	}
}

func generateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
