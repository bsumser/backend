package api

import (
	"fmt"
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

// Handler examples (defined as methods on Server to access DB later)
func (s *Server) handleGetDeck(w http.ResponseWriter, r *http.Request) {
	// 1. Correctly get the data from the Query String (?deck=...)
	deck := r.URL.Query().Get("deck")

	// 2. Set the header so the browser knows JSON is coming
	w.Header().Set("Content-Type", "application/json")

	// 3. Create a JSON response
	// If deck is empty, return a proper JSON error
	if deck == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "No deck provided"}`))
		return
	}

	// 4. Return a valid JSON object
	// We use fmt.Sprintf to wrap the result in JSON quotes
	responseJSON := fmt.Sprintf(`{"message": "Handling get deck", "data": "%s"}`, deck)

	w.Write([]byte(responseJSON))
}

func (s *Server) handleGetCard(w http.ResponseWriter, r *http.Request) {
	card := chi.URLParam(r, "card") // How Chi gets path params
	w.Write([]byte("Handling get card: " + card))
}

func (s *Server) handleGetItemByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // How Chi gets path params
	w.Write([]byte("Item ID: " + id))
}
