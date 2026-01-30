package tests

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"testing"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func TestDatabaseConnection(t *testing.T) {
	// 1. Load the env from the root directory
	// Note: since tests run in the /tests folder,
	// we might need to look one level up "../.env"
	_ = godotenv.Load("../.env")

	host := os.Getenv("DO_HOST")
	portStr := os.Getenv("DO_PORT")
	user := os.Getenv("DO_USER")
	dbname := os.Getenv("DO_DB_NAME")
	pass := os.Getenv("DO_PASSWORD")

	port, _ := strconv.Atoi(portStr)

	psqlSetup := fmt.Sprintf("host=%s port=%d user=%s dbname=%s password=%s sslmode=require",
		host, port, user, dbname, pass)

	db, err := sql.Open("postgres", psqlSetup)
	if err != nil {
		t.Fatalf("Critical error: could not parse conn string: %v", err)
	}

	// Ensure the database connection is closed when the test finishes
	defer db.Close()

	// 2. THE ACTUAL TEST: Ping the database
	err = db.Ping()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	t.Log("Successfully connected and pinged the database!")
}
