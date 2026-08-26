package handlers

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

func ns(v sql.NullString) string {
	if v.Valid {
		return v.String
	}
	return ""
}

// GetProfile returns the single profile row.
func GetProfile(c *fiber.Ctx) error {
	var (
		id, name                                              string
		headline, tagline, bio, avatar, location, email, phone sql.NullString
		resumeURL, github, linkedin, xURL, website             sql.NullString
		available                                             int
	)

	err := database.DB.QueryRow(`
		SELECT id, name, headline, tagline, bio, avatar, location, email, phone,
		       resume_url, available, github_url, linkedin_url, x_url, website_url
		FROM profile LIMIT 1
	`).Scan(&id, &name, &headline, &tagline, &bio, &avatar, &location, &email, &phone,
		&resumeURL, &available, &github, &linkedin, &xURL, &website)

	if err == sql.ErrNoRows {
		return c.JSON(fiber.Map{"success": true, "data": nil})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"id": id, "name": name,
		"headline": ns(headline), "tagline": ns(tagline), "bio": ns(bio),
		"avatar": ns(avatar), "location": ns(location),
		"email": ns(email), "phone": ns(phone),
		"resume_url": ns(resumeURL), "available": available == 1,
		"github_url": ns(github), "linkedin_url": ns(linkedin),
		"x_url": ns(xURL), "website_url": ns(website),
	}})
}

// ListProjects returns published projects, ordered.
func ListProjects(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, title, slug, summary, description, cover_image, tech_stack,
		       repo_url, live_url, year, featured
		FROM projects
		WHERE is_published = 1 AND deleted_at IS NULL
		ORDER BY featured DESC, order_no ASC, created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, title, slug string
		var summary, description, cover, tech, repo, live, year sql.NullString
		var featured int
		if err := rows.Scan(&id, &title, &slug, &summary, &description, &cover,
			&tech, &repo, &live, &year, &featured); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "title": title, "slug": slug,
			"summary": ns(summary), "description": ns(description),
			"cover_image": ns(cover), "tech_stack": ns(tech),
			"repo_url": ns(repo), "live_url": ns(live),
			"year": ns(year), "featured": featured == 1,
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// GetProjectBySlug returns one published project.
func GetProjectBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var id, title string
	var summary, description, cover, tech, repo, live, year sql.NullString
	var featured int

	err := database.DB.QueryRow(`
		SELECT id, title, summary, description, cover_image, tech_stack,
		       repo_url, live_url, year, featured
		FROM projects
		WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL LIMIT 1
	`, slug).Scan(&id, &title, &summary, &description, &cover, &tech,
		&repo, &live, &year, &featured)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "Proyek tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"id": id, "title": title, "slug": slug,
		"summary": ns(summary), "description": ns(description),
		"cover_image": ns(cover), "tech_stack": ns(tech),
		"repo_url": ns(repo), "live_url": ns(live),
		"year": ns(year), "featured": featured == 1,
	}})
}

// ListExperiences returns published work history.
func ListExperiences(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, role, company, company_url, location, employment,
		       start_date, end_date, is_current, description
		FROM experiences
		WHERE is_published = 1 AND deleted_at IS NULL
		ORDER BY order_no ASC, created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, role, company string
		var companyURL, location, employment, start, end, desc sql.NullString
		var current int
		if err := rows.Scan(&id, &role, &company, &companyURL, &location,
			&employment, &start, &end, &current, &desc); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "role": role, "company": company,
			"company_url": ns(companyURL), "location": ns(location),
			"employment": ns(employment),
			"start_date":  ns(start), "end_date": ns(end),
			"is_current": current == 1, "description": ns(desc),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// ListSkills returns published skills grouped-ready (category included).
func ListSkills(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, name, category, level, icon
		FROM skills
		WHERE is_published = 1 AND deleted_at IS NULL
		ORDER BY category ASC, order_no ASC, name ASC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, name, category string
		var level, icon sql.NullString
		if err := rows.Scan(&id, &name, &category, &level, &icon); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "name": name, "category": category,
			"level": ns(level), "icon": ns(icon),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}
