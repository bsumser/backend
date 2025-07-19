import { db } from '../db.js'; // Your existing database import

export async function getCardByName(name) {
  console.log(`[getCardByName] Debug: Querying DB for card name: "${name}"`);

  const publicImageBaseUrl = process.env.PUBLIC_IMAGE_BASE_URL;

  if (!publicImageBaseUrl) {
    console.warn(`[getCardByName] WARNING: PUBLIC_IMAGE_BASE_URL is not set. Cannot generate art URLs.`);
  }

  try {
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

    // ✅ --- NEW LOGGING BLOCK TO CHECK DB RETURN ---
    if (result.rows.length > 0) {
        console.log(`[getCardByName] ✅ SUCCESS: Found DB record for "${name}". Raw result:`);
        // We use JSON.stringify to properly inspect the full object, especially the image_filenames array.
        console.log(JSON.stringify(result.rows[0], null, 2)); 
    } else {
        console.log(`[getCardByName] ❌ FAILED: No DB record found for "${name}".`);
    }
    // ✅ --- END NEW LOGGING BLOCK ---

    const card = result.rows[0] || null;
  
    if (card) {
      card.artUrls = []; // Always create the array for consistent API responses
      
      if (publicImageBaseUrl && card.image_filenames && Array.isArray(card.image_filenames)) {
        card.artUrls = card.image_filenames.map(filename => 
          `${publicImageBaseUrl.replace(/\/$/, '')}/${filename}`
        );
      }
      
      delete card.image_filenames; // Clean up the raw field for the final response
    }
    
    // The final card object with the artUrls array will be returned
    return card;

  } catch (error) {
      console.error(`[getCardByName] ❌ DATABASE ERROR for card name "${name}":`, error);
      // Re-throw the error so the calling function knows something went wrong
      throw error;
  }
}