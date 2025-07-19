import { raw } from 'express';
import { getCardArtAll } from '../services/cardArtService.js';

export async function processDeck(req, res) {
    const parsedDeck = [];
    try {
        const rawDeck = req.query.deck;
        console.log(`Raw deck ${rawDeck}`); // Step 1

        if (!rawDeck) {
          console.log('❌ Missing deck parameter');
          return res.status(400).json({ error: 'Missing deck parameter' });
        }

        // Step 1: Parse deck into [{ count, name }]
        const tokens = rawDeck.trim().split(/\s+/);
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
    } catch (error) {
        console.error(`❌ Error parsing deck: ${error.message}`);
        res.status(500).json({ error: 'Failed to parse deck' });
    }

    console.log(`Parsed deck ${parsedDeck}`); // Step 2

    if (parsedDeck.length === 0) {
      console.log('❌ No valid card entries after parsing');
      return res.status(500).json({ error: 'No valid card entries found' });
    }

    const cardNames = parsedDeck.map(c => c.name);
    console.log('Fetching card art for', cardNames.join(',')); // Already there

    const cardData = await getCardArtAll(cardNames);

    if (process.env.NODE_ENV === 'test') {
        console.log('DEBUG: cardData received from getCardArtAll (mock):', cardData.map(c => c ? c.name : 'NULL_CARD'));
    }

    try {
        // For efficient lookup, create a Map from the fetched card data.
        // This handles different potential names (front face, full name, etc.).
        const cardMap = new Map();
        for (const dbCard of cardData) {
            if (dbCard && dbCard.name) {
                // Key by the full name, e.g., "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki"
                cardMap.set(dbCard.name.toLowerCase(), dbCard);

                // Also key by just the front face name for easy matching
                const frontFaceName = dbCard.name.split(' // ')[0];
                cardMap.set(frontFaceName.toLowerCase(), dbCard);

                // Also key by the second face name if it exists
                if(dbCard.facename) {
                    cardMap.set(dbCard.facename.toLowerCase(), dbCard);
                }
            }
        }

        // Now, map over your ORIGINAL parsedDeck to combine the count with the full card object.
        const fetchedCards = parsedDeck.map(c => {
            // Find the full card object from our map using a simple lookup.
            const match = cardMap.get(c.name.toLowerCase());

            if (!match) {
                console.error(`❌ No match found in cardMap for card: ${c.name}`);
                return null; // Card not found in the data we fetched from the DB
            }

            // Combine the count from the input deck with the full DB object.
            return {
                count: c.count,
                ...match, // Spread all properties from the matched DB card
            };
        }).filter(Boolean); // Filters out any nulls if a card wasn't found

        if (fetchedCards.length === 0) {
            console.log('❌ No matching cards were successfully processed from the database.');
            return res.status(404).json({ error: 'None of the requested cards could be found.' });
        }

        const response = {
            deck: fetchedCards
        };

        res.json(response);

    } catch (error) {
        console.error(`❌ Error processing deck: ${error.message}`);
        res.status(500).json({ error: 'Failed to process deck' });
    }
}