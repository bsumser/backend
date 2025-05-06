// app/controllers/cardController.js
import { getCardArtAll } from '../services/cardArtService.js';

export async function processCard(req, res) {
  try {
    const name = decodeURIComponent(req.originalUrl.replace('/card?', ''));
    const data = await getCardArtAll([name]);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Invalid card format' });
  }
}