package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	Router *chi.Mux
}

func CreateServer() *Server {
	s := &Server{Router: chi.NewRouter()}

	// 1. Add some standard middleware
	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)

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
	deck := chi.URLParam(r, "deck") // How Chi gets path params
	w.Write([]byte("Handling get deck: " + deck))
}

func (s *Server) handleGetCard(w http.ResponseWriter, r *http.Request) {
	card := chi.URLParam(r, "card") // How Chi gets path params
	w.Write([]byte("Handling get card: " + card))
}

func (s *Server) handleGetItemByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // How Chi gets path params
	w.Write([]byte("Item ID: " + id))
}
