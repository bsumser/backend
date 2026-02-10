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

var Db *sql.DB //created outside to make it global.

func TestDatabaseConnection(t *testing.T) {
	// 1. Load the env from the root directory
	// Note: since tests run in the /tests folder,
	// we might need to look one level up "../.env"
	err := godotenv.Load("../database.env") //by default, it is .env so we don't have to write
	if err != nil {
		fmt.Println("Error is occurred  on .env file please check")
	}

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

	// 2. THE ACTUAL TEST: Ping the database
	err = db.Ping()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	Db = db
	t.Log("Successfully connected and pinged the database!")
}

func TestCardQuery(t *testing.T) {
	t.Log("Running card query")
	const nameQuery string = `select name from cards limit 5`
	rows, err := Db.Query(nameQuery)
	if err != nil {
		t.Fatalf("Query failed: %v", err)
	}

	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Errorf("Error scanning row: %v", err)
			continue
		}
		t.Logf("Found card: %s", name)
	}
}

func TestCloseConnection(t *testing.T) {
	Db.Close()
	t.Log("Closed database connection")

}
