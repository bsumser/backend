// app/routes.js
import express from 'express';

// We don't need 'path', 'fs', or 'pool' for this specific hardcoded test route
// if all it does is return a URL string.
// Keep them if other routes in this file use them.

// Import controllers if other routes use them
import { healthCheck } from './controllers/healthController.js';
import { processDeck } from './controllers/deckController.js';
import { processCard } from './controllers/cardController.js';

const router = express.Router();

// Your other routes
router.get('/health', healthCheck);
router.get('/deck', processDeck);
router.get('/card', processCard);
router.get('/', (req, res) => {
  res.json({ info: 'Node.js, Express, and Postgres API - Nginx Image Test Mode' });
});

// --- ✅ MODIFIED TEST ROUTE: Returns a URL for an Nginx-served image ---
// The :uuid parameter is just a placeholder to match the route structure for testing.
router.get('/test/nginx-card-image/:uuidPlaceholder', async (req, res) => {
    const { uuidPlaceholder } = req.params; // We are ignoring this for the hardcoded image
    const publicImageBaseUrl = process.env.PUBLIC_IMAGE_BASE_URL;

    // Hardcode the filename of the image you want to test with
    // This must exactly match a file in your ./mtg_images directory
    const testImageFilename = 'Abandoned Sarcophagus_02d6e8f7-1b47-426d-a898-bf52c2e3877e.jpg';
    const testCardName = 'Abandoned Sarcophagus (Test)';


    if (!publicImageBaseUrl) {
        console.error('CRITICAL: PUBLIC_IMAGE_BASE_URL environment variable is not set.');
        return res.status(500).json({ error: 'Server configuration error: Public image base URL not configured.' });
    }

    // Construct the full public URL for the image
    // Ensure no double slashes if publicImageBaseUrl ends with /
    const imageUrl = `${publicImageBaseUrl.replace(/\/$/, '')}/${testImageFilename}`;

    console.log(`Node.js constructed image URL (to be served by Nginx): ${imageUrl} (using placeholder: ${uuidPlaceholder})`);
    
    // Send back JSON containing the URL
    res.json({
        info: "This URL should be served by Nginx. Open it in your browser.",
        uuidUsedInPath: uuidPlaceholder, // Just to show what was passed
        cardName: testCardName,
        imageFilename: testImageFilename,
        nginxImageUrl: imageUrl
    });
});

export default router;