package handlers

import (
	"database/sql"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login issues a JWT for the admin CMS.
func Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Payload tidak valid"})
	}
	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Email dan password wajib diisi"})
	}

	var (
		id, name, hash string
	)
	err := database.DB.QueryRow(
		"SELECT id, name, password_hash FROM users WHERE email = ? LIMIT 1",
		req.Email,
	).Scan(&id, &name, &hash)

	if err == sql.ErrNoRows {
		// Same message for unknown email and wrong password (no user enumeration).
		return c.Status(401).JSON(fiber.Map{"success": false, "message": "Email atau password salah"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Kesalahan server"})
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		return c.Status(401).JSON(fiber.Map{"success": false, "message": "Email atau password salah"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": id,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	})
	signed, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Gagal membuat token"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"token":   signed,
		"user":    fiber.Map{"id": id, "email": req.Email, "name": name},
	})
}

// Me returns the current admin user.
func Me(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	var id, email, name string
	err := database.DB.QueryRow(
		"SELECT id, email, name FROM users WHERE id = ? LIMIT 1", userID,
	).Scan(&id, &email, &name)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"success": false, "message": "Unauthorized"})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"user":    fiber.Map{"id": id, "email": email, "name": name},
	})
}
