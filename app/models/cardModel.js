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
        const publicImageBaseUrl = process.env.PUBLIC_IMAGE_BASE_URL;
    
        // ✅ UPDATED QUERY:
        // This query joins 'cards' with 'card_images' and uses json_agg
        // to collect all matching image filenames into a single JSON array field.
        const query = `
          SELECT
            c.*,
            (
              SELECT json_agg(ci.image_filename)
              FROM card_images AS ci
              WHERE ci.card_id = c.id
            ) AS image_filenames
          FROM
            cards AS c
          WHERE
            LOWER(c.name) = LOWER($1)
            OR LOWER(c.name) LIKE LOWER($1) || ' //%'
          LIMIT 1;
        `;
    
        const result = await db.query(query, [name]);
        const card = result.rows[0] || null;
    
        // ✅ NEW LOGIC to process the array of filenames
        if (card) {
          // The 'image_filenames' property will be an array (e.g., ["file1.jpg", "file2.png"])
          // or null if no images were found for that card.
        
          // We will create a new 'artUrls' array to hold the full URLs.
          card.artUrls = []; // Always create the array for consistent API responses
        
          if (publicImageBaseUrl && card.image_filenames && Array.isArray(card.image_filenames)) {
            card.artUrls = card.image_filenames.map(filename => 
              `${publicImageBaseUrl.replace(/\/$/, '')}/${filename}`
            );
          }
          
          // For a cleaner API response, we can remove the raw image_filenames field
          delete card.image_filenames;
        }
    
        // Now, the 'card' object will have an 'artUrls' array property.
        // Your controller can then return this 'card' object in the response.
        // For example:
        // res.json(card);
    
    } catch (error) {
        console.error(`Error processing card name "${name}":`, error);
        // Handle the error appropriately in your API
        // res.status(500).json({ error: 'Internal server error' });
    }
}