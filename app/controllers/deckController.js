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
    
    const fetchedCards = parsedDeck.map(c => {
        const match = cardData.find(dbCard => {
            // Use dbCard.facename for comparison if it exists, otherwise fall back to dbCard.name
            const lowerDbNameForComparison = dbCard.facename ? dbCard.facename.toLowerCase() : dbCard.name.toLowerCase();
            const lowerInputName = c.name.toLowerCase(); // This is the name from your parsed input (e.g., "Fable of the Mirror-Breaker")
        
            // Now, perform the exact match comparison
            return lowerDbNameForComparison === lowerInputName;
        });
    
        if (!match) {
            console.error(`❌ No match found for card: ${c.name}`);
            return null; // Return null for cards that don't match, to be filtered out later
        }
        return {
            count: c.count,
            name: match.name,       // Use the full name from the DB (e.g., "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki")
            image: match.image_uris, // Use the fetched image URIs
        };
    }).filter(Boolean); // This line filters out any 'null' values from the map, ensuring only matched cards are processed.

    console.log(`Final response ${response}`); // Step 5

    res.json(response);
  } catch (error) {
    console.error(`❌ Error processing deck ${error}`);
    res.status(500).json({ error: 'Failed to process deck' });
  }
}