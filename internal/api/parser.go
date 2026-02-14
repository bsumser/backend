package api

import (
	"regexp"
	"strconv"
	"strings"
)

type DeckEntry struct {
	Quantity int    `json:"quantity"`
	CardName string `json:"card_name"`
}

var lineRegex = regexp.MustCompile(`^(\d+)\s+(.*)$`)

// ParseDeckString converts the raw multiline string into a slice of DeckEntry
func ParseDeckString(rawDeck string) []DeckEntry {
	var deck []DeckEntry
	lines := strings.Split(strings.ReplaceAll(rawDeck, "\r\n", "\n"), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		matches := lineRegex.FindStringSubmatch(line)
		if len(matches) == 3 {
			qty, _ := strconv.Atoi(matches[1])
			deck = append(deck, DeckEntry{
				Quantity: qty,
				CardName: matches[2],
			})
		}
	}
	return deck
}
