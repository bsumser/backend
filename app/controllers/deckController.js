import { raw } from 'express';
import { getCardArtAll } from '../services/cardArtService.js';

export async function processDeck(req, res) {
  try {
    const rawDeck = req.query.deck;
    console.log(`Raw deck ${rawDeck}`); // Step 1

    if (!rawDeck) {
      console.log('❌ Missing deck parameter');
      return res.status(400).json({ error: 'Missing deck parameter' });
    }

    // Step 1: Parse deck into [{ count, name }]
    const tokens = rawDeck.trim().split(/\s+/);
    const parsedDeck = [];
    for (let i = 0; i < tokens.length; ) {
    const maybeCount = parseInt(tokens[i], 10);
    if (!isNaN(maybeCount) && tokens[i + 1]) {
      const nameParts = [];
      i++; // move past count
      while (i < tokens.length && isNaN(parseInt(tokens[i], 10))) {
        nameParts.push(tokens[i]);
        i++;
      }
      parsedDeck.push({
        count: maybeCount,
        name: nameParts.join(' '),
      });
        } else {
        i++; // skip invalid token
        }
    }

    console.log(`Parsed deck ${parsedDeck}`); // Step 2

    if (parsedDeck.length === 0) {
      console.log('❌ No valid card entries after parsing');
      return res.status(400).json({ error: 'No valid card entries found' });
    }

    const cardNames = parsedDeck.map(c => c.name);
    console.log(`Fetching card art for ${cardNames}`); // Step 3

    const cardData = await getCardArtAll(cardNames);
    console.log(`Fetched card data ${cardData}`); // Step 4

    const response = parsedDeck.map(({ name, count }) => {
      const match = cardData.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (!match) {
        console.log(`❌ No match found for card: ${name}`);
        return null;
      }
      return { ...match, count };
    }).filter(Boolean);

    console.log(`Final response ${response}`); // Step 5

    res.json(response);
  } catch (error) {
    console.error(`❌ Error processing deck ${error}`);
    res.status(500).json({ error: 'Failed to process deck' });
  }
}