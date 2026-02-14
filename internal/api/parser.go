package api

import (
	"net/url" // Import this
	"regexp"
	"strconv"
	"strings"
)

type DeckEntry struct {
	Quantity int    `json:"quantity"`
	CardName string `json:"card_name"`
}

var lineRegex = regexp.MustCompile(`^(\d+)\s+(.*)$`)

func ParseDeckString(rawDeck string) []DeckEntry {
	// 1. Convert "%20" to " " and "%0A" to "\n"
	decodedDeck, err := url.QueryUnescape(rawDeck)
	if err != nil {
		// If decoding fails, fall back to the raw string
		decodedDeck = rawDeck
	}

	var deck []DeckEntry

	// 2. Split the DECODED string
	lines := strings.Split(strings.ReplaceAll(decodedDeck, "\r\n", "\n"), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 3. Now the regex will find the spaces correctly
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
