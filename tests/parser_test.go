package tests

import (
	"backend/internal/api"
	"testing"
)

func TestParseDeck(t *testing.T) {
	t.Log("Testing Parser on: \n")
	t.Log("4%20Goldspan%20Dragon%0A4%20Hinata%2C%20Dawn-Crowned%0A4%20Expressive%20Iteration%0A1%20Abrade%0A1%20Dragon%27s%20Fire%0A2%20Flame-Blessed%20Bolt%0A4%20Jwari%20Disruption%0A4%20Magma%20Opus%0A2%20Make%20Disappear%0A1%20Negate%0A2%20Spikefield%20Hazard%0A1%20Valorous%20Stance%0A4%20Voltage%20Surge%0A4%20Fable%20of%20the%20Mirror-Breaker%0A1%20Eiganjo%2C%20Seat%20of%20the%20Empire%0A1%20Hall%20of%20Storm%20Giants%0A4%20Hengegate%20Pathway%0A1%20Mountain%0A4%20Needleverge%20Pathway%0A1%20Otawara%2C%20Soaring%20City%0A4%20Riverglide%20Pathway%0A1%20Sokenzan%2C%20Crucible%20of%20Defiance%0A4%20Stormcarved%20Coast%0A1%20Sundown%20Pass")

	deck := "4%20Goldspan%20Dragon%0A4%20Hinata%2C%20Dawn-Crowned%0A4%20Expressive%20Iteration%0A1%20Abrade%0A1%20Dragon%27s%20Fire%0A2%20Flame-Blessed%20Bolt%0A4%20Jwari%20Disruption%0A4%20Magma%20Opus%0A2%20Make%20Disappear%0A1%20Negate%0A2%20Spikefield%20Hazard%0A1%20Valorous%20Stance%0A4%20Voltage%20Surge%0A4%20Fable%20of%20the%20Mirror-Breaker%0A1%20Eiganjo%2C%20Seat%20of%20the%20Empire%0A1%20Hall%20of%20Storm%20Giants%0A4%20Hengegate%20Pathway%0A1%20Mountain%0A4%20Needleverge%20Pathway%0A1%20Otawara%2C%20Soaring%20City%0A4%20Riverglide%20Pathway%0A1%20Sokenzan%2C%20Crucible%20of%20Defiance%0A4%20Stormcarved%20Coast%0A1%20Sundown%20Pass"

	parsedDeck := api.ParseDeckString(deck)

	//log result of parser
	t.Logf("Parsed Deck: %+v", parsedDeck)

	// assert deck not empty
	if len(parsedDeck) == 0 {
		t.Error("Parsed deck is empty, check your regex or input format")
	}

}
