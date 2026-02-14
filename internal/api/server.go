package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Server struct {
	Router *chi.Mux
}

func CreateServer() *Server {
	s := &Server{Router: chi.NewRouter()}

	// 1. Add some standard middleware
	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)

	//CORS setup for api
	s.Router.Use(cors.Handler(cors.Options{
		// The exact origin of your frontend. No trailing slash!
		AllowedOrigins: []string{"https://bsumser.dev", "http://localhost:3000"},

		// Methods you plan to use
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},

		// Headers your frontend might send (like Content-Type for JSON)
		AllowedHeaders: []string{"Accept", "Content-Type", "Authorization"},

		// How long the browser should remember this "permission" (in seconds)
		MaxAge: 300,
	}))

	s.MountHandlers()
	return s
}

func (s *Server) MountHandlers() {
	//check so digital ocean doesn't say invalid
	s.Router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("MTG API is running..."))
	})

	// Basic Health Check
	s.Router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// 2. Route Grouping for your API
	s.Router.Route("/mtg", func(r chi.Router) {
		r.Get("/deck", s.handleGetDeck) // GET /api/v1/items

		r.Get("/card", s.handleGetCard) // GET /api/v1/items

		// Sub-routing for specific IDs
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", s.handleGetItemByID) // GET /api/v1/items/123
		})
	})
}

func (s *Server) handleGetDeck(w http.ResponseWriter, r *http.Request) {
	// 1. Get and validate data
	rawDeck := r.URL.Query().Get("deck")
	if rawDeck == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "No deck provided"}`))
		return
	}

	// 2. Use the logic from your parser.go file
	entries := ParseDeckString(rawDeck)

	// 3. Set the header once
	w.Header().Set("Content-Type", "application/json")

	// 4. Create a final response structure
	// This is better than manually building a string with Sprintf
	response := map[string]interface{}{
		"message": "Handling get deck",
		"data":    entries,
	}

	// 5. Encode the whole response as JSON in one go
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
	}
}

func (s *Server) handleGetCard(w http.ResponseWriter, r *http.Request) {
	card := chi.URLParam(r, "card") // How Chi gets path params
	w.Write([]byte("Handling get card: " + card))
}

func (s *Server) handleGetItemByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // How Chi gets path params
	w.Write([]byte("Item ID: " + id))
}
