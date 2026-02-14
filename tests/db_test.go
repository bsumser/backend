package tests

import (
	"backend/internal/api"
	"backend/internal/database"
	"testing"
)

func TestDatabaseConnection(t *testing.T) {
	// Now this matches the return signature of your function
	db, err := database.ConnectDatabase()

	if err != nil {
		t.Fatalf("Failed to connect to production DB logic: %v", err)
	}

	// Close the connection when the test finishes
	defer db.Close()

	if db == nil {
		t.Fatal("Database object is nil")
	}

	t.Log("Successfully connected and pinged the database!")
}

func TestCardQuery(t *testing.T) {
	db, err := database.ConnectDatabase()
	t.Log("Running card query")
	const nameQuery string = `select name from cards limit 5`
	rows, err := db.Query(nameQuery)
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

func TestDeckFetch(t *testing.T) {
	t.Log("Running deck fetch...")

	deck := "4%20Goldspan%20Dragon%0A4%20Hinata%2C%20Dawn-Crowned%0A4%20Expressive%20Iteration%0A1%20Abrade%0A1%20Dragon%27s%20Fire%0A2%20Flame-Blessed%20Bolt%0A4%20Jwari%20Disruption%0A4%20Magma%20Opus%0A2%20Make%20Disappear%0A1%20Negate%0A2%20Spikefield%20Hazard%0A1%20Valorous%20Stance%0A4%20Voltage%20Surge%0A4%20Fable%20of%20the%20Mirror-Breaker%0A1%20Eiganjo%2C%20Seat%20of%20the%20Empire%0A1%20Hall%20of%20Storm%20Giants%0A4%20Hengegate%20Pathway%0A1%20Mountain%0A4%20Needleverge%20Pathway%0A1%20Otawara%2C%20Soaring%20City%0A4%20Riverglide%20Pathway%0A1%20Sokenzan%2C%20Crucible%20of%20Defiance%0A4%20Stormcarved%20Coast%0A1%20Sundown%20Pass"
	parsedDeck := api.ParseDeckString(deck)

	t.Log("Deck parsed, querying db")
	db, err := database.ConnectDatabase()

	if err != nil {
		// FIX: Use t.Fatalf instead of 'return nil, err'
		t.Fatalf("error connecting to database: %v", err)
	}
	defer db.Close()

	for _, value := range parsedDeck {
		// Using the LIKE fix from before for double-faced cards
		nameQuery := `SELECT name FROM cards WHERE name = $1 OR name LIKE $1 || ' // %' LIMIT 1;`

		rows, err := db.Query(nameQuery, value.CardName)
		if err != nil {
			t.Errorf("Database error querying %s: %v", value.CardName, err)
			continue
		}

		found := false
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				t.Errorf("Error scanning row for %s: %v", value.CardName, err)
				continue
			}
			t.Logf("✅ Found: %s", name)
			found = true
		}
		rows.Close()

		// This is the part that makes the test FAIL
		if !found {
			t.Errorf("❌ Card not found in database: %s", value.CardName)
		}
	}
}
