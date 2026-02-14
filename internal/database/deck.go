package database

import (
	"backend/internal/models"

	"fmt"

	"github.com/lib/pq"
)

func (db *DB) FetchDeckData(entries []models.DeckEntry) ([]byte, error) {
	var names []string
	for _, e := range entries {
		names = append(names, e.CardName)
	}

	// Use a CTE to prepare search patterns once, making it easier for the index
	query := `
	WITH search_names AS (
		SELECT unnest($1::text[]) as val
	)
	SELECT COALESCE(json_agg(t), '[]'::json) FROM (
		SELECT DISTINCT ON (c.name)
			c.name, 
			c.manacost as mana_cost, 
			COALESCE(ci.image_url, '') as image_url
		FROM cards c
		JOIN search_names sn ON (
			c.name = sn.val OR 
			c.name LIKE (sn.val || ' // %')
		)
		LEFT JOIN card_images ci ON c.id = ci.card_id
		ORDER BY c.name, ci.id DESC
	) t;`

	var jsonData []byte
	// QueryRow is safe, but ensure the db pool isn't exhausted
	err := db.QueryRow(query, pq.Array(names)).Scan(&jsonData)
	if err != nil {
		return nil, fmt.Errorf("fetch deck data failed: %w", err)
	}

	return jsonData, nil
}
