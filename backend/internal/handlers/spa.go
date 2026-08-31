package handlers

import (
	"database/sql"
	"fmt"
	"html"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

var (
	spaHTML    string
	spaModTime time.Time
	spaMu      sync.RWMutex
)

func distPath() string {
	if p := os.Getenv("FRONTEND_DIST"); p != "" {
		return p
	}
	return "/www/wwwroot/novanurachman.my.id/frontend/dist"
}

// loadSpaHTML reads index.html, re-reading whenever the file changes on disk so
// a fresh frontend deploy is picked up without restarting the service.
func loadSpaHTML() error {
	indexPath := filepath.Join(distPath(), "index.html")

	info, err := os.Stat(indexPath)
	if err != nil {
		return err
	}

	spaMu.RLock()
	fresh := spaHTML != "" && info.ModTime().Equal(spaModTime)
	spaMu.RUnlock()
	if fresh {
		return nil
	}

	b, err := os.ReadFile(indexPath)
	if err != nil {
		return err
	}

	spaMu.Lock()
	spaHTML = string(b)
	spaModTime = info.ModTime()
	spaMu.Unlock()
	return nil
}

type pageMeta struct {
	Title       string
	Description string
	OGImage     string
}

func defaultMeta() pageMeta {
	return pageMeta{
		Title:       "Nova Nurachman — Developer",
		Description: "Personal profile, projects, and experience.",
		OGImage:     "/og-image.jpg",
	}
}

func metaForPath(path, lang string) pageMeta {
	meta := defaultMeta()

	// Project detail pages take their meta from the project itself.
	if strings.HasPrefix(path, "/projects/") {
		slug := strings.TrimPrefix(path, "/projects/")
		slug = strings.Trim(slug, "/")
		if slug != "" && !strings.Contains(slug, "/") {
			var titleEn, titleId sql.NullString
			var summary, cover sql.NullString
			err := database.DB.QueryRow(`
				SELECT title_en, title_id, summary_en, cover_image FROM projects
				WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL LIMIT 1
			`, slug).Scan(&titleEn, &titleId, &summary, &cover)
			if err == nil {
				if lang == "id" && titleId.Valid && titleId.String != "" {
					meta.Title = titleId.String + " — Nova Nurachman"
				} else {
					meta.Title = titleEn.String + " — Nova Nurachman"
				}
				if summary.Valid && summary.String != "" {
					meta.Description = summary.String
				}
				if cover.Valid && cover.String != "" {
					meta.OGImage = cover.String
				}
				return meta
			}
		}
	}

	// Blog posts take their meta from the post itself.
	if strings.HasPrefix(path, "/blog/") {
		slug := strings.TrimPrefix(path, "/blog/")
		slug = strings.Trim(slug, "/")
		if slug != "" && !strings.Contains(slug, "/") {
			var titleEn, titleId sql.NullString
			var excerpt, cover sql.NullString
			err := database.DB.QueryRow(`
				SELECT title_en, title_id, excerpt_en, cover_image FROM posts
				WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL LIMIT 1
			`, slug).Scan(&titleEn, &titleId, &excerpt, &cover)
			if err == nil {
				if lang == "id" && titleId.Valid && titleId.String != "" {
					meta.Title = titleId.String + " — Nova Nurachman"
				} else {
					meta.Title = titleEn.String + " — Nova Nurachman"
				}
				if excerpt.Valid && excerpt.String != "" {
					meta.Description = excerpt.String
				}
				if cover.Valid && cover.String != "" {
					meta.OGImage = cover.String
				}
				return meta
			}
		}
	}

	// Static routes come from the seo_meta table so they are editable in the CMS.
	var title, desc, og sql.NullString
	err := database.DB.QueryRow(
		"SELECT title, description, og_image FROM seo_meta WHERE path = ? AND lang = ? LIMIT 1", path, lang,
	).Scan(&title, &desc, &og)
	if err == nil {
		if title.Valid && title.String != "" {
			meta.Title = title.String
		}
		if desc.Valid && desc.String != "" {
			meta.Description = desc.String
		}
		if og.Valid && og.String != "" {
			meta.OGImage = og.String
		}
	}
	return meta
}

var staticTypes = map[string]string{
	".js": "application/javascript", ".css": "text/css",
	".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
	".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
	".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
	".json": "application/json", ".txt": "text/plain", ".xml": "application/xml",
}

// serveStatic serves a real file from dist/, guarding against path traversal.
func serveStatic(c *fiber.Ctx, reqPath string, ext string) error {
	clean := filepath.Clean("/" + reqPath)
	full := filepath.Join(distPath(), clean)

	// Confirm the resolved path is still inside dist/.
	if !strings.HasPrefix(full, filepath.Clean(distPath())+string(os.PathSeparator)) {
		return c.Status(403).SendString("Forbidden")
	}
	if _, err := os.Stat(full); err != nil {
		return c.Status(404).SendString("Not Found")
	}

	if ct, ok := staticTypes[ext]; ok {
		c.Set("Content-Type", ct)
	}
	if strings.HasPrefix(clean, "/assets/") {
		c.Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		c.Set("Cache-Control", "public, max-age=3600")
	}
	return c.SendFile(full)
}

// SPAHandler serves index.html with per-route meta injected, and serves real
// static files directly (nginx proxies everything here).
func SPAHandler(c *fiber.Ctx) error {
	reqPath := c.Path()

	if ext := strings.ToLower(filepath.Ext(reqPath)); ext != "" && ext != ".html" {
		return serveStatic(c, reqPath, ext)
	}

	lang := lang(c)

	if err := loadSpaHTML(); err != nil {
		return c.Status(503).SendString("Frontend belum di-built")
	}

	spaMu.RLock()
	out := spaHTML
	spaMu.RUnlock()

	meta := metaForPath(reqPath, lang)
	site := os.Getenv("SITE_URL")
	if site == "" {
		site = "https://novanurachman.my.id"
	}

	title := html.EscapeString(meta.Title)
	desc := html.EscapeString(meta.Description)
	ogImg := meta.OGImage
	if strings.HasPrefix(ogImg, "/") {
		ogImg = site + ogImg
	}
	canonical := site + reqPath

	injected := fmt.Sprintf(`<title>%s</title>
<meta name="description" content="%s"/>
<link rel="canonical" href="%s"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="%s"/>
<meta property="og:description" content="%s"/>
<meta property="og:image" content="%s"/>
<meta property="og:url" content="%s"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="%s"/>
<meta name="twitter:description" content="%s"/>`,
		title, desc, canonical, title, desc, ogImg, canonical, title, desc)

	// Replace the build-time placeholder title, then add the rest of the tags.
	if i := strings.Index(out, "<title>"); i >= 0 {
		if j := strings.Index(out[i:], "</title>"); j >= 0 {
			out = out[:i] + out[i+j+len("</title>"):]
		}
	}
	out = strings.Replace(out, "</head>", injected+"\n</head>", 1)

	c.Set("Content-Type", "text/html; charset=utf-8")
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	return c.SendString(out)
}

// SitemapHandler emits a sitemap built from the database.
func SitemapHandler(c *fiber.Ctx) error {
	site := os.Getenv("SITE_URL")
	if site == "" {
		site = "https://novanurachman.my.id"
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	sb.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")

	add := func(loc, priority string) {
		sb.WriteString("  <url>\n")
		sb.WriteString("    <loc>" + site + loc + "</loc>\n")
		sb.WriteString("    <priority>" + priority + "</priority>\n")
		sb.WriteString("  </url>\n")
	}

	add("/", "1.0")
	for _, p := range []string{"/projects", "/blog", "/experience", "/skills", "/contact"} {
		add(p, "0.8")
	}

	rows, err := database.DB.Query(`
		SELECT slug FROM projects
		WHERE is_published = 1 AND deleted_at IS NULL
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var slug string
			if rows.Scan(&slug) == nil {
				add("/projects/"+slug, "0.7")
			}
		}
	}

	postRows, err := database.DB.Query(`
		SELECT slug FROM posts
		WHERE is_published = 1 AND deleted_at IS NULL
		  AND (published_at IS NULL OR published_at <= NOW())
	`)
	if err == nil {
		defer postRows.Close()
		for postRows.Next() {
			var slug string
			if postRows.Scan(&slug) == nil {
				add("/blog/"+slug, "0.7")
			}
		}
	}

	sb.WriteString("</urlset>\n")
	c.Set("Content-Type", "application/xml")
	return c.SendString(sb.String())
}
