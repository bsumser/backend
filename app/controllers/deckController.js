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
      return res.status(500).json({ error: 'No valid card entries found' });
    }

    const cardNames = parsedDeck.map(c => c.name);
    console.log(`Fetching card art for ${cardNames}`); // Step 3

    const cardData = await getCardArtAll(cardNames);

    const fetchedCards = parsedDeck.map(c => {
            const match = cardData.find(dbCard => {
                const lowerDbNameForComparison = dbCard.facename ? dbCard.facename.toLowerCase() : dbCard.name.toLowerCase();
                const lowerInputName = c.name.toLowerCase();
                return lowerDbNameForComparison === lowerInputName;
            });

            if (!match) {
                // This console.error is for debugging purposes, it doesn't stop execution
                console.error(`❌ No match found for card: ${c.name}`);
                return null; // Return null for cards that don't match, to be filtered out
            }
            return {
                count: c.count,
                name: match.name, // Use the full name from the DB
                image: match.image_uris, // Use the fetched image URIs
            };
        }).filter(Boolean); // This filters out any 'null' values, resulting in an array of only matched cards

        // *** ADD THIS NEW BLOCK OF CODE HERE ***
        if (fetchedCards.length === 0) {
            // If after processing, no cards were successfully matched and fetched,
            // return a 404 (Not Found) or 400 (Bad Request) status.
            console.log('❌ No matching cards found for the provided input in the database.');
            return res.status(404).json({ error: 'No matching cards found for the provided input.' });
        }
        // *** END NEW BLOCK ***

        // This 'response' variable will now only be defined if fetchedCards is not empty
        const response = {
            deck: fetchedCards
        };

        res.json(response); // This is likely the line that was previously throwing the ReferenceError (e.g., line 70)

      } catch (error) {
        // This catch block handles other unexpected errors during deck processing
        console.error(`❌ Error processing deck ${error}`); // (e.g., line 72)
        res.status(500).json({ error: 'Failed to process deck' });
      }
}