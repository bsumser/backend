package api

import (
	"backend/internal/database" // Import your database package
	"net/http"                  // Added for JSON encoding if needed

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Server struct {
	Router *chi.Mux
	DB     *database.DB // FIX: Add the DB field here
}

// FIX: Pass the DB connection into the server constructor
func CreateServer(db *database.DB) *Server {
	s := &Server{
		Router: chi.NewRouter(),
		DB:     db, // Initialize the DB field
	}

	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)

	s.Router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"https://bsumser.dev", "http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type", "Authorization"},
		MaxAge:         300,
	}))

	s.MountHandlers()
	return s
}

func (s *Server) MountHandlers() {
	s.Router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("MTG API is running..."))
	})

	s.Router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	s.Router.Route("/mtg", func(r chi.Router) {
		r.Get("/deck", s.handleGetDeck)
		r.Get("/card", s.handleGetCard)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", s.handleGetItemByID)
		})
	})
}

func (s *Server) handleGetDeck(w http.ResponseWriter, r *http.Request) {
	rawDeck := r.URL.Query().Get("deck")
	if rawDeck == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "No deck provided"}`))
		return
	}

	entries := ParseDeckString(rawDeck)

	// This will now work because s.DB is defined!
	deckData, err := s.DB.FetchDeckData(entries)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	// If FetchDeckData returns []byte, use w.Write.
	// If it returns a slice of structs, use json.NewEncoder(w).Encode(deckData)
	w.Write(deckData)
}

func (s *Server) handleGetCard(w http.ResponseWriter, r *http.Request) {
	card := chi.URLParam(r, "card")
	w.Write([]byte("Handling get card: " + card))
}

func (s *Server) handleGetItemByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	w.Write([]byte("Item ID: " + id))
}
