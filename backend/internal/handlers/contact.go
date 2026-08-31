package handlers

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

func newID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}

type contactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

// CreateContact accepts a public contact-form submission.
func CreateContact(c *fiber.Ctx) error {
	var req contactRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Payload tidak valid"})
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Message = strings.TrimSpace(req.Message)

	if req.Name == "" || req.Email == "" || req.Message == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Nama, email, dan pesan wajib diisi",
		})
	}
	if !strings.Contains(req.Email, "@") || len(req.Email) > 191 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Email tidak valid"})
	}
	if len(req.Message) > 5000 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Pesan terlalu panjang"})
	}

	_, err := database.DB.Exec(`
		INSERT INTO contacts (id, name, email, subject, message, ip_address)
		VALUES (?, ?, ?, ?, ?, ?)
	`, newID("ct"), req.Name, req.Email, req.Subject, req.Message, c.IP())

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Gagal mengirim pesan"})
	}

	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"message": "Pesan terkirim. Terima kasih!",
	})
}

// ListContacts returns submissions for the admin inbox.
func ListContacts(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, name, email, subject, message, is_read, created_at
		FROM contacts ORDER BY created_at DESC LIMIT 200
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}
	defer rows.Close()

	out := []fiber.Map{}
	for rows.Next() {
		var id, name, email, message string
		var subject sql.NullString
		var isRead int
		var createdAt sql.NullTime
		if err := rows.Scan(&id, &name, &email, &subject, &message, &isRead, &createdAt); err != nil {
			continue
		}
		created := ""
		if createdAt.Valid {
			created = createdAt.Time.Format(time.RFC3339)
		}
		out = append(out, fiber.Map{
			"id": id, "name": name, "email": email,
			"subject": ns(subject), "message": message,
			"is_read": isRead == 1, "created_at": created,
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": out})
}

// MarkContactRead flips the read flag.
func MarkContactRead(c *fiber.Ctx) error {
	if _, err := database.DB.Exec(
		"UPDATE contacts SET is_read = 1 WHERE id = ?", c.Params("id"),
	); err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Gagal memperbarui"})
	}
	return c.JSON(fiber.Map{"success": true})
}

// DeleteContact removes a submission.
func DeleteContact(c *fiber.Ctx) error {
	if _, err := database.DB.Exec(
		"DELETE FROM contacts WHERE id = ?", c.Params("id"),
	); err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Gagal menghapus"})
	}
	return c.JSON(fiber.Map{"success": true})
}

// Stats powers the admin dashboard.
func Stats(c *fiber.Ctx) error {
	count := func(q string) int {
		var n int
		if err := database.DB.QueryRow(q).Scan(&n); err != nil {
			return 0
		}
		return n
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{
		"projects":        count("SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL"),
		"experiences":     count("SELECT COUNT(*) FROM experiences WHERE deleted_at IS NULL"),
		"skills":          count("SELECT COUNT(*) FROM skills WHERE deleted_at IS NULL"),
		"posts":           count("SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL"),
		"posts_published": count("SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL AND is_published = 1"),
		"contacts":        count("SELECT COUNT(*) FROM contacts"),
		"contacts_unread": count("SELECT COUNT(*) FROM contacts WHERE is_read = 0"),
	}})
}
