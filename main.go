package main

import (
	"backend/internal/api"      // Matches folder internal/api
	"backend/internal/database" // Matches folder internal/database
	"fmt"
	"net/http"
)

func main() {
	database.ConnectDatabase()

	srv := api.CreateServer()

	fmt.Println("Server running on port :5000")
	http.ListenAndServe(":5000", srv.Router)
}
