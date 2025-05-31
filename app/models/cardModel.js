// app/models/cardModel.js
import { db } from '../db.js';

export async function getCardByName(name) {
  const result = await db.query(
    'SELECT * FROM cards WHERE name ILIKE $1 LIMIT 1', // Added LIMIT 1 for efficiency
    [`%${name}%`]
  );
  // Return the first row found, or null if no rows were returned
  return result.rows[0] || null;
}