package tests

import (
	"backend/internal/api"
	"testing"
)

func TestParseDeck(t *testing.T) {
	t.Log("Testing Parser on: \n")

	deck := `4 Goldspan Dragon
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
	t.Logf("Testing Parser on: %s\n", deck)

	parsedDeck := api.ParseDeckString(deck)

	//log result of parser
	t.Logf("Parsed Deck: %+v", parsedDeck)

	// assert deck not empty
	if len(parsedDeck) == 0 {
		t.Error("Parsed deck is empty, check your regex or input format")
	}

}
