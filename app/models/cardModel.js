// app/models/cardModel.js
// Assuming this is in a file like app/models/cardModel.js or app/services/cardService.js
import { db } from '../db.js'; // Your existing database import

export async function getCardByName(name) {
  console.log(`[getCardByName] Debug: Querying DB for card name: "${name}" (length: ${name ? name.length : 'null'})`);

  // Retrieve the base URL for public images from environment variables
  const publicImageBaseUrl = process.env.PUBLIC_IMAGE_BASE_URL;

  if (!publicImageBaseUrl) {
    // This is a critical configuration. Log a warning or error.
    // The function will still proceed but artUrl will be null.
    console.warn(`[getCardByName] WARNING: PUBLIC_IMAGE_BASE_URL environment variable is not set. Cannot generate art URLs.`);
  }

  try {
    // Your existing flexible query.
    // SELECT * should retrieve all columns, including 'image_filename' if it exists.
    const result = await db.query(
      `SELECT * FROM cards
       WHERE LOWER(name) = LOWER($1)
          OR LOWER(name) LIKE LOWER($1) || ' //%'
       LIMIT 1;`,
      [name]
    );

    const card = result.rows[0] || null;

    if (card) {
      // If a card is found, attempt to add the artUrl
      if (publicImageBaseUrl && card.image_filename) {
        // Construct the full URL
        // .replace(/\/$/, '') ensures no double slash if publicImageBaseUrl already ends with one
        card.artUrl = `${publicImageBaseUrl.replace(/\/$/, '')}/${card.image_filename}`;
        console.log(`[getCardByName] Successfully added artUrl for "${card.name}": ${card.artUrl}`);
      } else {
        // If no base URL or no image_filename, set artUrl to null
        card.artUrl = null;
        if (!card.image_filename) {
          console.log(`[getCardByName] No image_filename found for card "${card.name}". artUrl set to null.`);
        }
      }
    }
    
    console.log(`[getCardByName] Debug: Final card object for "${name}":`, card); 
    return card; // Return the card object (now potentially with an artUrl property) or null

  } catch (error) {
    console.error(`[getCardByName] Error querying database for card name "${name}":`, error);
    // Depending on your error handling strategy, you might want to re-throw the error
    // or return null to indicate failure.
    throw error; // Or return null;
  }
}