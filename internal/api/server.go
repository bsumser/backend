package api // Must match the folder name

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Server struct {
	Router *chi.Mux
}

func CreateServer() *Server {
	s := &Server{Router: chi.NewRouter()}
	s.MountHandlers()
	return s
}

func (s *Server) MountHandlers() {
	s.Router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})
}
