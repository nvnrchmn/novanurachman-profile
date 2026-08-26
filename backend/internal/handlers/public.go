package handlers

import (
	"database/sql"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

func lang(c *fiber.Ctx) string {
	switch c.Query("lang", "en") {
	case "id", "in":
		return "id"
	}
	return "en"
}

func col(base, lang string) string {
	if lang == "id" {
		return base + "_id"
	}
	return base + "_en"
}

// GetProfile returns the single profile row, language-aware.
func GetProfile(c *fiber.Ctx) error {
	lang := lang(c)

	var (
		id, name                                              string
		headlineEn, headlineId                                sql.NullString
		taglineEn, taglineId                                  sql.NullString
		bioEn, bioId                                          sql.NullString
		avatar                                                sql.NullString
		locationEn, locationId                                sql.NullString
		email, phone                                          sql.NullString
		resumeURL                                             sql.NullString
		available                                             int
		github, linkedin, xURL, website                       sql.NullString
	)

	err := database.DB.QueryRow(`
		SELECT id, name,
		       headline_en, headline_id,
		       tagline_en, tagline_id,
		       bio_en, bio_id,
		       avatar,
		       location_en, location_id,
		       email, phone,
		       resume_url, available,
		       github_url, linkedin_url, x_url, website_url
		FROM profile LIMIT 1
	`).Scan(&id, &name,
		&headlineEn, &headlineId,
		&taglineEn, &taglineId,
		&bioEn, &bioId,
		&avatar,
		&locationEn, &locationId,
		&email, &phone,
		&resumeURL, &available,
		&github, &linkedin, &xURL, &website)

	if err == sql.ErrNoRows {
		return c.JSON(fiber.Map{"success": true, "data": nil})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"id": id, "name": name,
		"headline": pick(headlineEn, headlineId, lang),
		"tagline":  pick(taglineEn, taglineId, lang),
		"bio":      pick(bioEn, bioId, lang),
		"avatar":   ns(avatar),
		"location": pick(locationEn, locationId, lang),
		"email":    ns(email), "phone": ns(phone),
		"resume_url": ns(resumeURL), "available": available == 1,
		"github_url": ns(github), "linkedin_url": ns(linkedin),
		"x_url": ns(xURL), "website_url": ns(website),
	}})
}

func ns(v ...sql.NullString) string {
	if len(v) > 0 && v[0].Valid {
		return v[0].String
	}
	return ""
}

func pick(en, id sql.NullString, lang string) string {
	if lang == "id" && id.Valid && strings.TrimSpace(id.String) != "" {
		return id.String
	}
	return ns(en)
}

// ListProjects returns published projects, language-aware.
func ListProjects(c *fiber.Ctx) error {
	lang := lang(c)

	rows, err := database.DB.Query(`
		SELECT id,
		       title_en, title_id,
		       slug,
		       summary_en, summary_id,
		       description_en, description_id,
		       cover_image, tech_stack,
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
		var id, slug string
		var titleEn, titleId                    sql.NullString
		var summaryEn, summaryId                sql.NullString
		var descEn, descId                      sql.NullString
		var cover, tech, repo, live, year       sql.NullString
		var featured                            int
		if err := rows.Scan(&id,
			&titleEn, &titleId,
			&slug,
			&summaryEn, &summaryId,
			&descEn, &descId,
			&cover, &tech, &repo, &live, &year,
			&featured); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "slug": slug,
			"title":       pick(titleEn, titleId, lang),
			"summary":     pick(summaryEn, summaryId, lang),
			"description": pick(descEn, descId, lang),
			"cover_image": ns(cover),
			"tech_stack":  ns(tech),
			"repo_url":    ns(repo), "live_url": ns(live),
			"year": ns(year), "featured": featured == 1,
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// GetProjectBySlug returns one published project.
func GetProjectBySlug(c *fiber.Ctx) error {
	lang := lang(c)
	slug := c.Params("slug")

	var id string
	var titleEn, titleId                    sql.NullString
	var summaryEn, summaryId                sql.NullString
	var descEn, descId                      sql.NullString
	var cover, tech, repo, live, year       sql.NullString
	var featured                            int

	err := database.DB.QueryRow(`
		SELECT id,
		       title_en, title_id,
		       summary_en, summary_id,
		       description_en, description_id,
		       cover_image, tech_stack,
		       repo_url, live_url, year, featured
		FROM projects
		WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL LIMIT 1
	`, slug).Scan(&id,
		&titleEn, &titleId,
		&summaryEn, &summaryId,
		&descEn, &descId,
		&cover, &tech, &repo, &live, &year,
		&featured)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "Project not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Server error"})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"id": id, "slug": slug,
		"title":       pick(titleEn, titleId, lang),
		"summary":     pick(summaryEn, summaryId, lang),
		"description": pick(descEn, descId, lang),
		"cover_image": ns(cover),
		"tech_stack":  ns(tech),
		"repo_url":    ns(repo), "live_url": ns(live),
		"year": ns(year), "featured": featured == 1,
	}})
}

// ListExperiences returns published work history.
func ListExperiences(c *fiber.Ctx) error {
	lang := lang(c)

	rows, err := database.DB.Query(`
		SELECT id,
		       role_en, role_id,
		       company_en, company_id,
		       company_url,
		       location_en, location_id,
		       employment_en, employment_id,
		       start_date, end_date, is_current,
		       description_en, description_id
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
		var id string
		var roleEn, roleId                     sql.NullString
		var companyEn, companyId               sql.NullString
		var companyURL                         sql.NullString
		var locationEn, locationId             sql.NullString
		var employmentEn, employmentId         sql.NullString
		var start, end                         sql.NullString
		var current                            int
		var descEn, descId                     sql.NullString
		if err := rows.Scan(&id,
			&roleEn, &roleId,
			&companyEn, &companyId,
			&companyURL,
			&locationEn, &locationId,
			&employmentEn, &employmentId,
			&start, &end, &current,
			&descEn, &descId); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id,
			"role":        pick(roleEn, roleId, lang),
			"company":     pick(companyEn, companyId, lang),
			"company_url": ns(companyURL),
			"location":    pick(locationEn, locationId, lang),
			"employment":  pick(employmentEn, employmentId, lang),
			"start_date":  ns(start), "end_date": ns(end),
			"is_current": current == 1,
			"description": pick(descEn, descId, lang),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// ListSkills returns published skills.
func ListSkills(c *fiber.Ctx) error {
	lang := lang(c)

	rows, err := database.DB.Query(`
		SELECT id, name, category, level_en, level_id, icon
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
		var levelEn, levelId    sql.NullString
		var icon                sql.NullString
		if err := rows.Scan(&id, &name, &category, &levelEn, &levelId, &icon); err != nil {
			continue
		}
		out = append(out, fiber.Map{
			"id": id, "name": name, "category": category,
			"level": pick(levelEn, levelId, lang),
			"icon":  ns(icon),
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}
