package handlers

import (
	"database/sql"
	"fmt"
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
	SELECT p.id, p.slug,
	       p.title_en, p.title_id,
	       p.excerpt_en, p.excerpt_id,
	       p.content_en, p.content_id,
	       p.cover_image, p.tags, p.published_at,
	       p.category_id, p.view_count,
	       c.id as cat_id, c.name_en as cat_name_en, c.name_id as cat_name_id, c.slug as cat_slug
	FROM posts p
	LEFT JOIN categories c ON p.category_id = c.id AND c.deleted_at IS NULL`

// scanPost scans one row produced by postSelect into a fiber.Map, resolving
// language through pick() so the public API only ever exposes one language.
func scanPost(rows interface {
	Scan(dest ...interface{}) error
}, lang string) (fiber.Map, error) {
	var id, slug string
	var titleEn, titleId, excerptEn, excerptId sql.NullString
	var contentEn, contentId, cover, tags sql.NullString
	var publishedAt sql.NullTime
	var categoryId, catId, catNameEn, catNameId, catSlug sql.NullString
	var viewCount sql.NullInt64

	err := rows.Scan(&id, &slug,
		&titleEn, &titleId,
		&excerptEn, &excerptId,
		&contentEn, &contentId,
		&cover, &tags, &publishedAt,
		&categoryId, &viewCount,
		&catId, &catNameEn, &catNameId, &catSlug)
	if err != nil {
		return nil, err
	}

	pub := ""
	if publishedAt.Valid {
		pub = publishedAt.Time.Format(time.RFC3339)
	}

	category := fiber.Map{}
	if catId.Valid {
		category = fiber.Map{
			"id":   catId.String,
			"name": pick(catNameEn, catNameId, lang),
			"slug": ns(catSlug),
		}
	}

	// Fetch tags for this post
	tagRows, _ := database.DB.Query(`
		SELECT t.id, t.name, t.slug, t.color
		FROM tags t
		JOIN post_tags pt ON pt.tag_id = t.id
		WHERE pt.post_id = ? AND t.deleted_at IS NULL
		ORDER BY t.name ASC`, id)
	var tagsList []fiber.Map
	if tagRows != nil {
		for tagRows.Next() {
			var tid, tname, tslug, tcolor sql.NullString
			tagRows.Scan(&tid, &tname, &tslug, &tcolor)
			if tid.Valid {
				tagsList = append(tagsList, fiber.Map{
					"id":    tid.String,
					"name":  ns(tname),
					"slug":  ns(tslug),
					"color": ns(tcolor),
				})
			}
		}
		tagRows.Close()
	}

	return fiber.Map{
		"id":            id,
		"slug":          slug,
		"title":         pick(titleEn, titleId, lang),
		"excerpt":       pick(excerptEn, excerptId, lang),
		"content":       pick(contentEn, contentId, lang),
		"cover_image":   ns(cover),
		"tags":          ns(tags),
		"tags_list":     tagsList,
		"published_at":  pub,
		"category":      category,
		"view_count":    viewCount.Int64,
	}, nil
}

// ListPosts returns published posts, newest first. A post is public when it is
// published and its scheduled time (if any) has passed. Supports ?category=<id> filter.
func ListPosts(c *fiber.Ctx) error {
	lang := lang(c)
	categoryID := c.Query("category")

	base := postSelect + `
		WHERE p.is_published = 1 AND p.deleted_at IS NULL
		  AND (p.published_at IS NULL OR p.published_at <= NOW())`
	args := []interface{}{}

	if categoryID != "" {
		base += ` AND p.category_id = ?`
		args = append(args, categoryID)
	}

	base += ` ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 100`

	rows, err := database.DB.Query(base, args...)
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
		WHERE p.slug = ? AND p.is_published = 1 AND p.deleted_at IS NULL
		  AND (p.published_at IS NULL OR p.published_at <= NOW())
		LIMIT 1`, slug)

	item, err := scanPost(row, lang)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "Postingan tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}

	// Increment view count (async, don't block response)
	go func(slug string) {
		database.DB.Exec(`UPDATE posts SET view_count = view_count + 1 WHERE slug = ?`, slug)
	}(slug)

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

// --- New handlers for categories, tags, related posts ---

// ListCategories returns all categories (for public filter dropdown).
func ListCategories(c *fiber.Ctx) error {
	lang := lang(c)
	rows, err := database.DB.Query(`
		SELECT id, name_en, name_id, slug, description_en, description_id, sort_order
		FROM categories
		WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, name_en ASC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, nameEn, nameId, slug, descEn, descId sql.NullString
		var sortOrder sql.NullInt64
		if err := rows.Scan(&id, &nameEn, &nameId, &slug, &descEn, &descId, &sortOrder); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id":          id.String,
			"name":        pick(nameEn, nameId, lang),
			"slug":        ns(slug),
			"description": pick(descEn, descId, lang),
			"sort_order":  sortOrder.Int64,
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// ListTags returns all tags (for tag cloud / filter).
func ListTags(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, name, slug, color
		FROM tags
		WHERE deleted_at IS NULL
		ORDER BY name ASC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, name, slug, color sql.NullString
		if err := rows.Scan(&id, &name, &slug, &color); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id":    id.String,
			"name":  ns(name),
			"slug":  ns(slug),
			"color": ns(color),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// GetPostTags returns tags for a specific post (by slug).
func GetPostTags(c *fiber.Ctx) error {
	postSlug := c.Params("slug")
	rows, err := database.DB.Query(`
		SELECT t.id, t.name, t.slug, t.color
		FROM tags t
		JOIN post_tags pt ON pt.tag_id = t.id
		JOIN posts p ON p.id = pt.post_id
		WHERE p.slug = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL
		ORDER BY t.name ASC`, postSlug)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, name, slug, color sql.NullString
		if err := rows.Scan(&id, &name, &slug, &color); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id":    id.String,
			"name":  ns(name),
			"slug":  ns(slug),
			"color": ns(color),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// GetRelatedPosts returns posts sharing tags/category with the given post (by slug).
func GetRelatedPosts(c *fiber.Ctx) error {
	lang := lang(c)
	postSlug := c.Params("slug")
	limit := 5

	// First get the post's category
	var categoryID sql.NullString
	err := database.DB.QueryRow(`SELECT category_id FROM posts WHERE slug = ? AND deleted_at IS NULL`, postSlug).Scan(&categoryID)
	if err != nil {
		return c.JSON(fiber.Map{"success": true, "data": []fiber.Map{}})
	}

	// Get tag IDs for this post (via slug)
	tagRows, _ := database.DB.Query(`
		SELECT pt.tag_id FROM post_tags pt
		JOIN posts p ON p.id = pt.post_id
		WHERE p.slug = ?`, postSlug)
	var tagIDs []string
	for tagRows.Next() {
		var tid sql.NullString
		tagRows.Scan(&tid)
		if tid.Valid {
			tagIDs = append(tagIDs, tid.String)
		}
	}
	tagRows.Close()

	if !categoryID.Valid && len(tagIDs) == 0 {
		return c.JSON(fiber.Map{"success": true, "data": []fiber.Map{}})
	}

	// Build query for related posts
	args := []interface{}{postSlug}
	where := `WHERE p.slug != ? AND p.is_published = 1 AND p.deleted_at IS NULL
			  AND (p.published_at IS NULL OR p.published_at <= NOW())`

	if categoryID.Valid {
		where += ` AND p.category_id = ?`
		args = append(args, categoryID.String)
	}
	if len(tagIDs) > 0 {
		placeholders := strings.Repeat("?,", len(tagIDs))
		placeholders = placeholders[:len(placeholders)-1]
		where += fmt.Sprintf(` AND EXISTS (SELECT 1 FROM post_tags pt2 WHERE pt2.post_id = p.id AND pt2.tag_id IN (%s))`, placeholders)
		for _, tid := range tagIDs {
			args = append(args, tid)
		}
	}

	q := fmt.Sprintf(`
		SELECT p.id, p.slug, p.title_en, p.title_id, p.excerpt_en, p.excerpt_id,
		       p.cover_image, p.published_at, p.view_count,
		       c.id as cat_id, c.name_en as cat_name_en, c.name_id as cat_name_id, c.slug as cat_slug
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id AND c.deleted_at IS NULL
		%s
		ORDER BY p.view_count DESC, COALESCE(p.published_at, p.created_at) DESC
		LIMIT %d`, where, limit)

	rows, err := database.DB.Query(q, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, slug, titleEn, titleId, excerptEn, excerptId, cover sql.NullString
		var publishedAt sql.NullTime
		var viewCount sql.NullInt64
		var catId, catNameEn, catNameId, catSlug sql.NullString

		if err := rows.Scan(&id, &slug, &titleEn, &titleId, &excerptEn, &excerptId,
			&cover, &publishedAt, &viewCount,
			&catId, &catNameEn, &catNameId, &catSlug); err != nil {
			continue
		}

		pub := ""
		if publishedAt.Valid {
			pub = publishedAt.Time.Format(time.RFC3339)
		}

		category := fiber.Map{}
		if catId.Valid {
			category = fiber.Map{
				"id":   catId.String,
				"name": pick(catNameEn, catNameId, lang),
				"slug": ns(catSlug),
			}
		}

		out = append(out, fiber.Map{
			"id":            id.String,
			"slug":          ns(slug),
			"title":         pick(titleEn, titleId, lang),
			"excerpt":       pick(excerptEn, excerptId, lang),
			"cover_image":   ns(cover),
			"published_at":  pub,
			"category":      category,
			"view_count":    viewCount.Int64,
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}
