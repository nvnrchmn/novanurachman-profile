package handlers

import (
	"sync/atomic"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

var visitorCount int64

func VisitorCounter(c *fiber.Ctx) error {
	atomic.AddInt64(&visitorCount, 1)

	userAgent := c.Get("User-Agent")
	referer := c.Get("Referer")
	page := c.Path()

	_, _ = database.DB.Exec(`
		INSERT INTO visitor_logs (ip_address, user_agent, referer, page_visited)
		VALUES (?, ?, ?, ?)
	`, c.IP(), userAgent, referer, page)

	return c.Next()
}

func GetVisitorCount(c *fiber.Ctx) error {
	var dbCount int64
	err := database.DB.QueryRow("SELECT COUNT(*) FROM visitor_logs").Scan(&dbCount)
	if err != nil {
		dbCount = atomic.LoadInt64(&visitorCount)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"total_visitors": atomic.LoadInt64(&visitorCount) + dbCount,
			"total_visits":   atomic.LoadInt64(&visitorCount),
		},
	})
}
