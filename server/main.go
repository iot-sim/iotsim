package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	fiber "github.com/gofiber/fiber/v2"
	cors "github.com/gofiber/fiber/v2/middleware/cors"
)

type Request struct {
	Protocol string `json:"protocol"`
	Server   string `json:"server"`
	Method   string `json:"method"`
	URLPath  string `json:"urlpath"`
	Body     string `json:"body"`
}

func main() {
	app := fiber.New()
	// Add middleware to enable CORS
	app.Use(cors.New())

	app.Post("/api", func(c *fiber.Ctx) error {
		request := new(Request)

		if err := c.BodyParser(request); err != nil {
			return err
		}
		fmt.Print(request)

		client := &http.Client{}
		req, err := http.NewRequest(request.Method, request.Server+request.URLPath, bytes.NewBuffer([]byte(request.Body)))
		if err != nil {
			return err
		}

		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}

		return c.SendString(string(body))
	})

	app.Listen(":3000")
}
