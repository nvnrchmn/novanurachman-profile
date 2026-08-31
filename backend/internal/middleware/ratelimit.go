package middleware

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

type rateEntry struct {
	count     int
	resetTime time.Time
}

var (
	rateMu      sync.Mutex
	rateLimiter = make(map[string]*rateEntry)
	rateLimit   = 100 // requests per minute per IP
)

func RateLimit() fiber.Handler {
	return func(c *fiber.Ctx) error {
		ip := c.IP()
		now := time.Now()

		rateMu.Lock()
		defer rateMu.Unlock()

		entry, exists := rateLimiter[ip]
		if !exists || now.After(entry.resetTime) {
			rateLimiter[ip] = &rateEntry{
				count:     1,
				resetTime: now.Add(time.Minute),
			}
			return c.Next()
		}

		entry.count++
		if entry.count > rateLimit {
			return c.Status(429).JSON(fiber.Map{
				"success": false,
				"message": "Too many requests. Please try again later.",
			})
		}

		return c.Next()
	}
}
