package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// Define the DB struct so other files in this package can see it
type DB struct {
	*sql.DB
}

func ConnectDatabase() (*DB, error) {
	// --- ROBUST ENV LOADING ---
	// Search upward for the database.env file starting from the current working directory
	dir, _ := os.Getwd()
	for {
		path := filepath.Join(dir, "database.env")
		if _, err := os.Stat(path); err == nil {
			godotenv.Load(path)
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break // Reached system root without finding .env
		}
		dir = parent
	}
	// ---------------------------

	host := os.Getenv("DO_HOST")
	portStr := os.Getenv("DO_PORT")

	// If portStr is empty, Atoi returns 0, which is causing your error
	port, err := strconv.Atoi(portStr)
	if err != nil || port == 0 {
		return nil, fmt.Errorf("invalid or missing DO_PORT: %v", portStr)
	}

	user := os.Getenv("DO_USER")
	dbname := os.Getenv("DO_DB_NAME")
	pass := os.Getenv("DO_PASSWORD")

	// Double check that we actually got a host
	if host == "" {
		return nil, fmt.Errorf("DO_HOST is not set in environment")
	}

	// Change sslmode from disable to require
	psqlSetup := fmt.Sprintf("host=%s port=%d user=%s dbname=%s password=%s sslmode=require",
		host, port, user, dbname, pass)

	db, err := sql.Open("postgres", psqlSetup)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	// sql.Open doesn't actually test the connection, so we Ping it
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("error pinging database: %w", err)
	}

	// Return the specific instance
	return &DB{db}, nil
}
