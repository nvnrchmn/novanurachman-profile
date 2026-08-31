package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// SecurityHeaders adds security headers to every response.
func SecurityHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Prevent clickjacking
		c.Set("X-Frame-Options", "SAMEORIGIN")
		// Prevent MIME type sniffing
		c.Set("X-Content-Type-Options", "nosniff")
		// XSS protection
		c.Set("X-XSS-Protection", "1; mode=block")
		// Referrer policy
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		// Permissions policy
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		// Content Security Policy
		c.Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'")
		// Strict Transport Security (1 year, include subdomains)
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		return c.Next()
	}
}
