package tests

import (
	"backend/internal/api"      // Import api for CreateServer and Server
	"backend/internal/database" // Import database for connection
	"backend/internal/models"   // Import models for decoding results
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestHandleGetDeck_Integration(t *testing.T) {
	// 1. Initialize DB
	db, err := database.ConnectDatabase()
	if err != nil {
		t.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	s := api.CreateServer(db)

	// 2. Use a RAW string for the deck
	// This makes it easy to read and edit the test data
	rawDeck := `4 Goldspan Dragon
		4 Hinata, Dawn-Crowned
		4 Expressive Iteration
		1 Abrade
		1 Dragon's Fire
		2 Flame-Blessed Bolt
		4 Jwari Disruption
		4 Magma Opus
		2 Make Disappear
		1 Negate
		2 Spikefield Hazard
		1 Valorous Stance
		4 Voltage Surge
		4 Fable of the Mirror-Breaker
		1 Eiganjo, Seat of the Empire
		1 Hall of Storm Giants
		4 Hengegate Pathway
		1 Mountain
		4 Needleverge Pathway
		1 Otawara, Soaring City
		4 Riverglide Pathway
		1 Sokenzan, Crucible of Defiance
		4 Stormcarved Coast
		1 Sundown Pass`

	// 3. Encode the raw string for the URL correctly
	deckQuery := url.QueryEscape(rawDeck)

	// 4. Create the Request
	req, err := http.NewRequest("GET", "/mtg/deck?deck="+deckQuery, nil)
	if err != nil {
		t.Fatal(err)
	}

	// 5. Execute through the Router
	rr := httptest.NewRecorder()
	s.Router.ServeHTTP(rr, req)

	// 6. Assertions
	if rr.Code != http.StatusOK {
		t.Errorf("Wrong status: got %v. Body: %s", rr.Code, rr.Body.String())
	}

	var results []models.CardResult
	if err := json.NewDecoder(rr.Body).Decode(&results); err != nil {
		t.Fatalf("Failed to decode JSON: %v", err)
	}

	// Since we use DISTINCT in SQL, the count should match the number of lines
	t.Logf("Successfully found %d cards in the database", len(results))

	if len(results) == 0 {
		t.Error("Database returned 0 cards. Check if your test DB has data!")
	}
}
