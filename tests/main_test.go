package tests

import (
	"backend/internal/api"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthCheck(t *testing.T) {
	srv := api.CreateServer()
	req, _ := http.NewRequest("GET", "/health", nil)
	rr := httptest.NewRecorder()

	srv.Router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}
