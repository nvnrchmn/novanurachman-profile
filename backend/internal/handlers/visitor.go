package handlers

import (
	"regexp"
	"strings"
	"sync/atomic"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

var visitorCount int64

// realIP resolves the client address through the nginx proxy headers. Without
// this every visitor looks like 127.0.0.1 and unique-visitor stats are useless.
func realIP(c *fiber.Ctx) string {
	if xff := c.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i > 0 {
			xff = xff[:i]
		}
		if ip := strings.TrimSpace(xff); ip != "" {
			return ip
		}
	}
	if xr := c.Get("X-Real-IP"); xr != "" {
		if ip := strings.TrimSpace(xr); ip != "" {
			return ip
		}
	}
	return c.IP()
}

// assetRequestRe matches requests for static files — they are not page views.
var assetRequestRe = regexp.MustCompile(`(?i)\.(js|css|png|jpe?g|webp|svg|ico|woff2?|ttf|json|txt|xml|pdf|mp4|webm|map)$`)

// botUaRe catches the common crawler/crawler-like user agents so analytics and
// the public counter reflect humans (and real browsers) only.
var botUaRe = regexp.MustCompile(`(?i)bot|crawl|spider|slurp|scrape|wget|curl|python|go-http-client|headless|facebookexternalhit|whatsapp|telegrambot|claude`)

// attackPathRe matches scanner/exploit probes that never legitimately exist on
// this site (WordPress paths, phpMyAdmin, dotfiles, etc.).
var attackPathRe = regexp.MustCompile(`(?i)wp-(admin|login|json|content|includes)|(^|/)wp(/|$|\?)|wordpress|xmlrpc\.php|phpmyadmin|cgi-bin|index\.php|(^|/)\.(env|git|DS_Store|bak|old|sql|sh)|(^|/)(shell|vendor|backup|_ignition|__nextjs)(/|$|\?)|^/(login|user|users)(/|$|\?)`)

// VisitorCounter records one page view per HTML navigation. Static assets,
// API calls, attack probes, and crawlers are skipped so the numbers stay
// meaningful.
func VisitorCounter(c *fiber.Ctx) error {
	path := c.Path()

	if strings.HasPrefix(path, "/api/") ||
		strings.HasPrefix(path, "/uploads/") ||
		path == "/feed.xml" ||
		path == "/sitemap.xml" ||
		path == "/robots.txt" ||
		path == "/sw.js" ||
		path == "/manifest.json" ||
		path == "/favicon.svg" ||
		attackPathRe.MatchString(path) ||
		assetRequestRe.MatchString(path) {
		return c.Next()
	}

	userAgent := c.Get("User-Agent")
	if botUaRe.MatchString(userAgent) {
		return c.Next()
	}

	atomic.AddInt64(&visitorCount, 1)

	_, _ = database.DB.Exec(`
		INSERT INTO visitor_logs (ip_address, user_agent, referer, page_visited)
		VALUES (?, ?, ?, ?)
	`, realIP(c), userAgent, c.Get("Referer"), path)

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
