package handlers

import (
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

// The same filters used at capture time, applied again at query time so the
// historical rows (logged before the middleware filter existed) stay excluded.

// cleanWhere is the shared WHERE fragment: real page views only.
// The double backslash is SQL-string escaping: MySQL turns \\. into the regex
// \. (literal dot) — single backslashes would escape the '.' away entirely.
// The third clause drops scanner/attack paths (WordPress probes, etc.) that
// never legitimately exist on this site.
const cleanWhere = `WHERE page_visited NOT REGEXP '\\.(js|css|png|jpe?g|webp|svg|ico|woff2?|ttf|json|txt|xml|pdf|mp4|webm|map)$'
  AND user_agent NOT REGEXP 'bot|crawl|spider|slurp|scrape|wget|curl|python|go-http-client|headless|facebookexternalhit|whatsapp|telegrambot|claude'
  AND page_visited NOT REGEXP 'wp-(admin|login|json|content|includes)|(^|/)wp(/|$|\\?)|wordpress|xmlrpc\\.php|phpmyadmin|cgi-bin|index\\.php|(^|/)\\.(env|git|DS_Store|bak|old|sql|sh)|(^|/)(shell|vendor|backup|_ignition|__nextjs)(/|$|\\?)|^/(login|user|users)(/|$|\\?)'`

// Analytics returns everything the dashboard needs in one request.
func Analytics(c *fiber.Ctx) error {
	days := 30
	if d, err := strconv.Atoi(c.Query("days", "30")); err == nil && d >= 1 && d <= 90 {
		days = d
	}

	sum := func(q string, args ...interface{}) int {
		var n int
		if err := database.DB.QueryRow(q, args...).Scan(&n); err != nil {
			return 0
		}
		return n
	}

	summary := fiber.Map{
		"total_views":    sum("SELECT COUNT(*) FROM visitor_logs " + cleanWhere),
		"total_visitors": sum("SELECT COUNT(DISTINCT ip_address) FROM visitor_logs " + cleanWhere),
		"views_today": sum(`SELECT COUNT(*) FROM visitor_logs `+cleanWhere+`
			AND created_at >= CURDATE()`),
		"visitors_today": sum(`SELECT COUNT(DISTINCT ip_address) FROM visitor_logs `+cleanWhere+`
			AND created_at >= CURDATE()`),
		"views_7d": sum(`SELECT COUNT(*) FROM visitor_logs `+cleanWhere+`
			AND created_at >= CURDATE() - INTERVAL 6 DAY`),
		"views_prev_7d": sum(`SELECT COUNT(*) FROM visitor_logs `+cleanWhere+`
			AND created_at >= CURDATE() - INTERVAL 13 DAY AND created_at < CURDATE() - INTERVAL 6 DAY`),
	}

	prev := summary["views_prev_7d"].(int)
	cur := summary["views_7d"].(int)
	delta := 0.0
	if prev > 0 {
		delta = (float64(cur) - float64(prev)) / float64(prev) * 100
	}
	summary["delta_7d"] = delta

	// ---- Daily series (missing days filled with zeroes) ----
	rows, err := database.DB.Query(`
		SELECT DATE(created_at), COUNT(*), COUNT(DISTINCT ip_address)
		FROM visitor_logs `+cleanWhere+`
		  AND created_at >= CURDATE() - INTERVAL ? DAY
		GROUP BY DATE(created_at) ORDER BY 1`, days-1)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	byDate := map[string][2]int{}
	for rows.Next() {
		var d time.Time
		var views, visitors int
		if rows.Scan(&d, &views, &visitors) == nil {
			byDate[d.Format("2006-01-02")] = [2]int{views, visitors}
		}
	}

	daily := []fiber.Map{}
	today := time.Now()
	for i := days - 1; i >= 0; i-- {
		key := today.AddDate(0, 0, -i).Format("2006-01-02")
		v := byDate[key]
		daily = append(daily, fiber.Map{"date": key, "views": v[0], "visitors": v[1]})
	}

	// ---- Top pages ----
	pageRows, err := database.DB.Query(`
		SELECT page_visited, COUNT(*) FROM visitor_logs `+cleanWhere+`
		GROUP BY page_visited ORDER BY 2 DESC LIMIT 10`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	pages := []fiber.Map{}
	for pageRows.Next() {
		var page string
		var n int
		if pageRows.Scan(&page, &n) == nil {
			if page == "" {
				page = "/"
			}
			pages = append(pages, fiber.Map{"page": page, "views": n})
		}
	}
	pageRows.Close()

	// ---- Referrers, aggregated by hostname (empty = direct visit) ----
	refRows, err := database.DB.Query(`
		SELECT COALESCE(referer, ''), COUNT(*) FROM visitor_logs `+cleanWhere+`
		GROUP BY referer ORDER BY 2 DESC LIMIT 50`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	refCounts := map[string]int{}
	for refRows.Next() {
		var ref string
		var n int
		if refRows.Scan(&ref, &n) == nil {
			refCounts[referrerHost(ref)] += n
		}
	}
	refRows.Close()
	referrers := topPairs(refCounts, 10)

	// ---- Devices & browsers, classified from the UA strings ----
	uaRows, err := database.DB.Query(`
		SELECT user_agent, COUNT(*) FROM visitor_logs `+cleanWhere+`
		GROUP BY user_agent ORDER BY 2 DESC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	devices := map[string]int{}
	browsers := map[string]int{}
	for uaRows.Next() {
		var ua string
		var n int
		if uaRows.Scan(&ua, &n) == nil {
			devices[classifyDevice(ua)] += n
			browsers[classifyBrowser(ua)] += n
		}
	}
	uaRows.Close()

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"summary":   summary,
		"daily":     daily,
		"pages":     pages,
		"referrers": referrers,
		"devices":   devices,
		"browsers":  browsers,
	}})
}

func referrerHost(raw string) string {
	if strings.TrimSpace(raw) == "" {
		return "(direct)"
	}
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return "(unknown)"
	}
	return strings.TrimPrefix(u.Host, "www.")
}

func topPairs(m map[string]int, limit int) []fiber.Map {
	out := []fiber.Map{}
	for k, v := range m {
		out = append(out, fiber.Map{"host": k, "views": v})
	}
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && out[j]["views"].(int) > out[j-1]["views"].(int); j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	if len(out) > limit {
		out = out[:limit]
	}
	return out
}

func classifyDevice(ua string) string {
	switch {
	case strings.Contains(ua, "bot") || strings.Contains(ua, "crawl"):
		return "Bot"
	case strings.Contains(ua, "iPad") || strings.Contains(ua, "Tablet") || strings.Contains(ua, "SM-T"):
		return "Tablet"
	case strings.Contains(ua, "Mobile") || strings.Contains(ua, "Android"):
		return "Mobile"
	default:
		return "Desktop"
	}
}

func classifyBrowser(ua string) string {
	switch {
	case strings.Contains(ua, "Edg/"):
		return "Edge"
	case strings.Contains(ua, "OPR/") || strings.Contains(ua, "Opera"):
		return "Opera"
	case strings.Contains(ua, "SamsungBrowser"):
		return "Samsung Internet"
	case strings.Contains(ua, "Chrome") && !strings.Contains(ua, "Edg/"):
		return "Chrome"
	case strings.Contains(ua, "Firefox"):
		return "Firefox"
	case strings.Contains(ua, "Safari"):
		return "Safari"
	default:
		return "Lainnya"
	}
}
