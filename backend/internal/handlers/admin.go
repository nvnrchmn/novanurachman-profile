package handlers

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

// tableSpec whitelists the columns each admin resource may write.
// Whitelisting (rather than trusting the payload) prevents SQL injection via
// column names and stops clients from writing internal fields.
type tableSpec struct {
	table       string
	prefix      string
	columns     []string
	soft        bool   // has deleted_at
	nullIfEmpty []string // empty-string values are stored as NULL
	orderBy     string // default: order_no ASC, id DESC
}

var specs = map[string]tableSpec{
	"posts": {
		table:  "posts",
		prefix: "po",
		columns: []string{
			"title_en", "title_id", "slug",
			"excerpt_en", "excerpt_id",
			"content_en", "content_id",
			"cover_image", "tags", "is_published", "published_at",
		},
		soft:        true,
		nullIfEmpty: []string{"published_at"},
		orderBy:     "COALESCE(published_at, created_at) DESC, id DESC",
	},
	"projects": {
		table:  "projects",
		prefix: "pj",
		columns: []string{
			"title", "slug", "summary", "description", "cover_image",
			"tech_stack", "repo_url", "live_url", "year", "featured",
			"order_no", "is_published",
		},
		soft: true,
	},
	"experiences": {
		table:  "experiences",
		prefix: "ex",
		columns: []string{
			"role", "company", "company_url", "location", "employment",
			"start_date", "end_date", "is_current", "description",
			"order_no", "is_published",
		},
		soft: true,
	},
	"skills": {
		table:  "skills",
		prefix: "sk",
		columns: []string{
			"name", "category", "level", "icon", "order_no", "is_published",
		},
		soft: true,
	},
}

// boolish normalises JSON true/false and 1/0 into an int for TINYINT columns.
func boolish(v interface{}) interface{} {
	switch t := v.(type) {
	case bool:
		if t {
			return 1
		}
		return 0
	default:
		return v
	}
}

func isBoolCol(col string) bool {
	switch col {
	case "featured", "is_published", "is_current":
		return true
	}
	return false
}

// contains reports whether a slice holds the given string.
func contains(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}

// emptyVal reports whether a decoded JSON value is an empty/whitespace string.
func emptyVal(v interface{}) bool {
	s, ok := v.(string)
	return ok && strings.TrimSpace(s) == ""
}

// AdminList returns every row (including unpublished) for the CMS table.
func AdminList(resource string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		spec, ok := specs[resource]
		if !ok {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Resource tidak dikenal"})
		}

		cols := append([]string{"id"}, spec.columns...)
		where := ""
		if spec.soft {
			where = "WHERE deleted_at IS NULL"
		}
		orderBy := spec.orderBy
		if orderBy == "" {
			orderBy = "order_no ASC, id DESC"
		}
		q := fmt.Sprintf("SELECT %s FROM %s %s ORDER BY %s",
			strings.Join(cols, ", "), spec.table, where, orderBy)

		rows, err := database.DB.Query(q)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		defer rows.Close()

		out := []fiber.Map{}
		for rows.Next() {
			vals := make([]interface{}, len(cols))
			ptrs := make([]interface{}, len(cols))
			for i := range vals {
				ptrs[i] = &vals[i]
			}
			if err := rows.Scan(ptrs...); err != nil {
				continue
			}
			item := fiber.Map{}
			for i, col := range cols {
				switch v := vals[i].(type) {
				case []byte:
					item[col] = string(v)
				case nil:
					item[col] = ""
				default:
					item[col] = v
				}
			}
			out = append(out, item)
		}
		return c.JSON(fiber.Map{"success": true, "data": out})
	}
}

// AdminCreate inserts a row using only whitelisted columns.
func AdminCreate(resource string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		spec, ok := specs[resource]
		if !ok {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Resource tidak dikenal"})
		}

		var body map[string]interface{}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "message": "Payload tidak valid"})
		}

		cols := []string{"id"}
		holders := []string{"?"}
		args := []interface{}{newID(spec.prefix)}

		for _, col := range spec.columns {
			if v, ok := body[col]; ok {
				cols = append(cols, col)
				holders = append(holders, "?")
				if isBoolCol(col) {
					args = append(args, boolish(v))
				} else if contains(spec.nullIfEmpty, col) && emptyVal(v) {
					args = append(args, nil)
				} else {
					args = append(args, v)
				}
			}
		}

		q := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
			spec.table, strings.Join(cols, ", "), strings.Join(holders, ", "))

		if _, err := database.DB.Exec(q, args...); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		return c.Status(201).JSON(fiber.Map{"success": true})
	}
}

// AdminUpdate patches whitelisted columns on one row.
func AdminUpdate(resource string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		spec, ok := specs[resource]
		if !ok {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Resource tidak dikenal"})
		}

		var body map[string]interface{}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "message": "Payload tidak valid"})
		}

		sets := []string{}
		args := []interface{}{}
		for _, col := range spec.columns {
			if v, ok := body[col]; ok {
				sets = append(sets, col+" = ?")
				if isBoolCol(col) {
					args = append(args, boolish(v))
				} else if contains(spec.nullIfEmpty, col) && emptyVal(v) {
					args = append(args, nil)
				} else {
					args = append(args, v)
				}
			}
		}
		if len(sets) == 0 {
			return c.Status(400).JSON(fiber.Map{"success": false, "message": "Tidak ada field untuk diperbarui"})
		}

		args = append(args, c.Params("id"))
		q := fmt.Sprintf("UPDATE %s SET %s WHERE id = ?", spec.table, strings.Join(sets, ", "))

		if _, err := database.DB.Exec(q, args...); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		return c.JSON(fiber.Map{"success": true})
	}
}

// AdminDelete soft-deletes when the table supports it.
func AdminDelete(resource string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		spec, ok := specs[resource]
		if !ok {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Resource tidak dikenal"})
		}

		var q string
		if spec.soft {
			q = fmt.Sprintf("UPDATE %s SET deleted_at = NOW() WHERE id = ?", spec.table)
		} else {
			q = fmt.Sprintf("DELETE FROM %s WHERE id = ?", spec.table)
		}

		if _, err := database.DB.Exec(q, c.Params("id")); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		return c.JSON(fiber.Map{"success": true})
	}
}

// UpsertProfile writes the single profile row (creates it if missing).
func UpsertProfile(c *fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Payload tidak valid"})
	}

	allowed := []string{
		"name", "headline", "tagline", "bio", "avatar", "location",
		"email", "phone", "resume_url", "available",
		"github_url", "linkedin_url", "x_url", "website_url",
	}

	var existingID string
	err := database.DB.QueryRow("SELECT id FROM profile LIMIT 1").Scan(&existingID)

	if err != nil {
		// No row yet: insert.
		cols := []string{"id"}
		holders := []string{"?"}
		args := []interface{}{newID("pf")}
		for _, col := range allowed {
			if v, ok := body[col]; ok {
				cols = append(cols, col)
				holders = append(holders, "?")
				if col == "available" {
					args = append(args, boolish(v))
				} else {
					args = append(args, v)
				}
			}
		}
		if len(cols) == 1 {
			return c.Status(400).JSON(fiber.Map{"success": false, "message": "Tidak ada data"})
		}
		q := fmt.Sprintf("INSERT INTO profile (%s) VALUES (%s)",
			strings.Join(cols, ", "), strings.Join(holders, ", "))
		if _, err := database.DB.Exec(q, args...); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		return c.Status(201).JSON(fiber.Map{"success": true})
	}

	sets := []string{}
	args := []interface{}{}
	for _, col := range allowed {
		if v, ok := body[col]; ok {
			sets = append(sets, col+" = ?")
			if col == "available" {
				args = append(args, boolish(v))
			} else {
				args = append(args, v)
			}
		}
	}
	if len(sets) == 0 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Tidak ada field untuk diperbarui"})
	}
	args = append(args, existingID)
	q := fmt.Sprintf("UPDATE profile SET %s WHERE id = ?", strings.Join(sets, ", "))
	if _, err := database.DB.Exec(q, args...); err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": err.Error()})
	}
	return c.JSON(fiber.Map{"success": true})
}
