package handlers

import (
	"database/sql"
	"html"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/yuin/goldmark"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

// postCols returns the columns a public post query needs, plus the scan targets.
// Keeping this in one place means list + detail stay in sync.
const postSelect = `
	SELECT id, slug,
	       title_en, title_id,
	       excerpt_en, excerpt_id,
	       content_en, content_id,
	       cover_image, tags, published_at
	FROM posts`

// scanPost scans one row produced by postSelect into a fiber.Map, resolving
// language through pick() so the public API only ever exposes one language.
func scanPost(rows interface {
	Scan(dest ...interface{}) error
}, lang string) (fiber.Map, error) {
	var id, slug string
	var titleEn, titleId, excerptEn, excerptId sql.NullString
	var contentEn, contentId, cover, tags sql.NullString
	var publishedAt sql.NullTime

	err := rows.Scan(&id, &slug,
		&titleEn, &titleId,
		&excerptEn, &excerptId,
		&contentEn, &contentId,
		&cover, &tags, &publishedAt)
	if err != nil {
		return nil, err
	}

	pub := ""
	if publishedAt.Valid {
		pub = publishedAt.Time.Format(time.RFC3339)
	}

	return fiber.Map{
		"id":           id,
		"slug":         slug,
		"title":        pick(titleEn, titleId, lang),
		"excerpt":      pick(excerptEn, excerptId, lang),
		"content":      pick(contentEn, contentId, lang),
		"cover_image":  ns(cover),
		"tags":         ns(tags),
		"published_at": pub,
	}, nil
}

// ListPosts returns published posts, newest first. A post is public when it is
// published and its scheduled time (if any) has passed.
func ListPosts(c *fiber.Ctx) error {
	lang := lang(c)

	rows, err := database.DB.Query(postSelect + `
		WHERE is_published = 1 AND deleted_at IS NULL
		  AND (published_at IS NULL OR published_at <= NOW())
		ORDER BY COALESCE(published_at, created_at) DESC
		LIMIT 100`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		item, err := scanPost(rows, lang)
		if err != nil {
			continue
		}
		out = append(out, item)
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// GetPostBySlug returns one published post including its markdown content.
func GetPostBySlug(c *fiber.Ctx) error {
	lang := lang(c)
	slug := c.Params("slug")

	row := database.DB.QueryRow(postSelect+`
		WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL
		  AND (published_at IS NULL OR published_at <= NOW())
		LIMIT 1`, slug)

	item, err := scanPost(row, lang)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "Postingan tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	return c.JSON(fiber.Map{"success": true, "data": item})
}

var markdown = goldmark.New()

// FeedHandler emits an RSS 2.0 feed of published posts. Post bodies are
// markdown, so goldmark converts them to HTML for feed readers.
func FeedHandler(c *fiber.Ctx) error {
	site := os.Getenv("SITE_URL")
	if site == "" {
		site = "https://novanurachman.my.id"
	}

	rows, err := database.DB.Query(postSelect + `
		WHERE is_published = 1 AND deleted_at IS NULL
		  AND (published_at IS NULL OR published_at <= NOW())
		ORDER BY COALESCE(published_at, created_at) DESC
		LIMIT 20`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	type feedItem struct {
		title, link, pubDate, desc, content string
		tags                                 []string
	}

	items := []feedItem{}
	for rows.Next() {
		var id, slug string
		var titleEn, titleId, excerptEn, excerptId sql.NullString
		var contentEn, contentId, cover, tags sql.NullString
		var publishedAt sql.NullTime

		if err := rows.Scan(&id, &slug,
			&titleEn, &titleId,
			&excerptEn, &excerptId,
			&contentEn, &contentId,
			&cover, &tags, &publishedAt); err != nil {
			continue
		}

		pub := time.Now()
		if publishedAt.Valid {
			pub = publishedAt.Time
		}

		var contentHTML strings.Builder
		_ = markdown.Convert([]byte(pick(contentEn, contentId, "en")), &contentHTML)

		items = append(items, feedItem{
			title:   pick(titleEn, titleId, "en"),
			link:    site + "/blog/" + slug,
			pubDate: pub.Format(time.RFC1123Z),
			desc:    pick(excerptEn, excerptId, "en"),
			content: contentHTML.String(),
			tags:    splitTags(ns(tags)),
		})
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	sb.WriteString(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">` + "\n")
	sb.WriteString("<channel>\n")
	sb.WriteString("<title>Nova Nurachman — Blog</title>\n")
	sb.WriteString("<link>" + site + "</link>\n")
	sb.WriteString("<description>Tulisan tentang pengembangan web, infrastruktur, dan pengalaman teknis.</description>\n")
	sb.WriteString(`<atom:link href="` + site + `/feed.xml" rel="self" type="application/rss+xml"/>` + "\n")
	sb.WriteString("<language>en</language>\n")

	for _, it := range items {
		sb.WriteString("<item>\n")
		sb.WriteString("<title>" + html.EscapeString(it.title) + "</title>\n")
		sb.WriteString("<link>" + html.EscapeString(it.link) + "</link>\n")
		sb.WriteString("<guid isPermaLink=\"true\">" + html.EscapeString(it.link) + "</guid>\n")
		sb.WriteString("<pubDate>" + it.pubDate + "</pubDate>\n")
		sb.WriteString("<description>" + html.EscapeString(it.desc) + "</description>\n")
		sb.WriteString("<content:encoded><![CDATA[" + it.content + "]]></content:encoded>\n")
		for _, tag := range it.tags {
			sb.WriteString("<category>" + html.EscapeString(tag) + "</category>\n")
		}
		sb.WriteString("</item>\n")
	}

	sb.WriteString("</channel>\n")
	sb.WriteString("</rss>")

	c.Set("Content-Type", "application/rss+xml; charset=utf-8")
	return c.SendString(sb.String())
}

// splitTags turns a comma-separated tag string into a clean slice.
func splitTags(s string) []string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
