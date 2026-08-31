package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"github.com/nvnrchmn/novanurachman-profile/internal/database"
	"github.com/nvnrchmn/novanurachman-profile/internal/handlers"
	"github.com/nvnrchmn/novanurachman-profile/internal/middleware"
)

func main() {
	_ = godotenv.Load()

	if err := database.Connect(); err != nil {
		log.Fatalf("database: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:               "novanurachman.my.id",
		DisableStartupMessage: true,
		BodyLimit:             10 * 1024 * 1024,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RateLimit())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://novanurachman.my.id,http://localhost:5173",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization,X-CSRF-Token",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// ---- Public read endpoints ----
	api.Get("/profile", handlers.GetProfile)
	api.Get("/projects", handlers.ListProjects)
	api.Get("/projects/:slug", handlers.GetProjectBySlug)
	api.Get("/experiences", handlers.ListExperiences)
	api.Get("/skills", handlers.ListSkills)
	api.Get("/posts", handlers.ListPosts)
	api.Get("/posts/:slug", handlers.GetPostBySlug)
	api.Get("/visitors", handlers.GetVisitorCount)

	// ---- Contact form (CSRF protected) ----
	api.Post("/contact", middleware.CSRF(), handlers.CreateContact)

	// ---- Auth ----
	api.Post("/auth/login", handlers.Login)

	// ---- Admin (JWT protected) ----
	admin := api.Group("/admin", middleware.Protected())
	admin.Get("/me", handlers.Me)
	admin.Get("/stats", handlers.Stats)

	admin.Put("/profile", handlers.UpsertProfile)

	for _, res := range []string{"posts", "projects", "experiences", "skills"} {
		admin.Get("/"+res, handlers.AdminList(res))
		admin.Post("/"+res, handlers.AdminCreate(res))
		admin.Put("/"+res+"/:id", handlers.AdminUpdate(res))
		admin.Delete("/"+res+"/:id", handlers.AdminDelete(res))
	}

	admin.Get("/contacts", handlers.ListContacts)
	admin.Put("/contacts/:id/read", handlers.MarkContactRead)
	admin.Delete("/contacts/:id", handlers.DeleteContact)

	// Uploads served straight from disk.
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "/www/wwwroot/novanurachman.my.id/uploads"
	}
	app.Static("/uploads", uploadDir)

	app.Get("/sitemap.xml", handlers.SitemapHandler)
	app.Get("/feed.xml", handlers.FeedHandler)

	// Visitor counter (tracks all page views)
	app.Use(handlers.VisitorCounter)

	// Catch-all: SPA with per-route meta injection. Must stay last.
	app.Get("/*", handlers.SPAHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}
	log.Printf("listening on :%s", port)
	if err := app.Listen("127.0.0.1:" + port); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
