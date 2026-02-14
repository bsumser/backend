package api

import (
	"backend/internal/models" // Use the shared models
	"regexp"
	"strconv"
	"strings"
)

var lineRegex = regexp.MustCompile(`(?m)^\s*(\d+)\s+(.+)$`)

func ParseDeckString(rawDeck string) []models.DeckEntry {
	var deck []models.DeckEntry

	// Normalize newlines and split
	cleanInput := strings.ReplaceAll(rawDeck, "\r\n", "\n")
	lines := strings.Split(cleanInput, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		matches := lineRegex.FindStringSubmatch(line)
		if len(matches) >= 3 {
			qty, _ := strconv.Atoi(matches[1])
			deck = append(deck, models.DeckEntry{
				Quantity: qty,
				CardName: strings.TrimSpace(matches[2]),
			})
		}
	}
	return deck
}
