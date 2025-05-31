// app/models/cardModel.js
import { db } from '../db.js';

export async function getCardByName(name) {
  console.log(`Debug: Querying DB for card name: "${name}" (length: ${name ? name.length : 'null'})`);
  
  // Use a more flexible query to handle both single-faced cards and DFCs
  // It tries an exact match OR a match where the name starts with the input followed by ' //'
  const result = await db.query(
    `SELECT * FROM cards
     WHERE LOWER(name) = LOWER($1)
        OR LOWER(name) LIKE LOWER($1) || ' //%'
     LIMIT 1;`,
    [name] // Pass the original name
  );
  
  console.log(`Debug: DB query result for "${name}":`, result.rows[0]); 
  return result.rows[0] || null;
}