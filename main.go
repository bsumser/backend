package main

import (
	"backend/internal/api"      // Matches folder internal/api
	"backend/internal/database" // Matches folder internal/database
	"log"
	"net/http"
)

func main() {
	// 1. Connect to DB
	db, err := database.ConnectDatabase()
	if err != nil {
		log.Fatal(err)
	}

	// 2. Pass DB to server
	server := api.CreateServer(db)

	// 3. Start listening
	http.ListenAndServe(":8080", server.Router)
}
