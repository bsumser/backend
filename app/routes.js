// app/routes.js
import express from 'express';
import { healthCheck } from './controllers/healthController.js';
import { processDeck } from './controllers/deckController.js';
import { processCard } from './controllers/cardController.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/deck', processDeck);
router.get('/card', processCard);
// ✅ Base route
router.get('/', (req, res) => {
  res.json({ info: 'Node.js, Express, and Postgres API' });
});

export default router;
