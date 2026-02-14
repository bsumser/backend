package models

type DeckEntry struct {
	Quantity int    `json:"quantity"`
	CardName string `json:"card_name"`
}

type CardResult struct {
	Name     string `json:"name"`
	ManaCost string `json:"manacost"`
	ImageURL string `json:"image_url"`
}
