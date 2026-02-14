package tests

import (
	"backend/internal/api"
	"backend/internal/database"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthCheck(t *testing.T) {
	db, err := database.ConnectDatabase()
	if err != nil {
		t.Fatalf("Could not connect to DB: %v", err)
	}
	srv := api.CreateServer(db)
	req, _ := http.NewRequest("GET", "/health", nil)
	rr := httptest.NewRecorder()

	srv.Router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}
