// app/models/cardModel.js
import { db } from '../db.js';

export async function getCardByName(name) {
  const result = await db.query(
    'SELECT * FROM cards WHERE name ILIKE $1',
    [`%${name}%`]
  );
  return result.rows;
}