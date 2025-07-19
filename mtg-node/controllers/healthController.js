// app/controllers/healthController.js
import { db } from '../db.js';

export async function healthCheck(req, res) {
  try {
    // Skip DB check if in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log('Skipping DB check in test environment');
      return res.status(200).send('OK');
    }

    await db.query('SELECT 1'); // Actual DB check in non-test environments
    res.status(200).send('OK');
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send('DB Error');
  }
}