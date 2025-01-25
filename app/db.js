import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import pkg from 'pg';

const PORT = 8080;
const { Pool } = pkg; // Destructure `Pool` from the default import

const app = express();

// Enable CORS for all routes
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: process.env.POSTGRES_PORT, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false,
    cert: fs.readFileSync('./ca-certificate.crt').toString(),
  },
});

// Base route
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});

export default pool;

// Route to handle deck processing
app.get('/deck', async (req, res) => {
  try {
    let deck = req.originalUrl;
    deck = deck.replace('/deck?', '');
    deck = decodeURIComponent(deck);
    deck = deck.split(/(?<=\d)(?=[A-Za-z])|(?<=[A-Za-z])(?=\d)/);
    console.log(deck);

    const newDeck = deck.map((card) => {
      const split = card.split(/ (.*)/);
      return split[1]; // Extract card name
    });

    console.log(newDeck);

    const out = await getCardArtAll(newDeck);

    // Map card data to desired response format
    const response = out.map((card) => ({
      name: card.name,
      color: card.colors,
      type: card.type
    }));

    res.json(response);
  } catch (error) {
    console.error('Error processing deck:', error);
    res.status(500).json({ error: 'Failed to process deck' });
  }
});

app.get('/card', async (req, res) => {
  try {
    let card = req.originalUrl;
    deck = deck.replace('/card?', '');
    deck = decodeURIComponent(deck);
    console.log(deck);

    const out = await getCardArtAll(deck);

    // Map card data to desired response format
    const response = out.map((card) => ({
      name: card.name,
      color: card.colors,
      type: card.type
    }));

    res.json(response);
  } catch (error) {
    console.error('Error processing deck:', error);
    res.status(500).json({ error: 'Failed to process deck' });
  }
});

// Function to query PostgreSQL for card art data
async function getCardArtAll(deckList) {
  try {
    // Validate deckList
    if (!Array.isArray(deckList) || deckList.some((item) => item == null)) {
      throw new Error('deckList must be an array of valid card names.');
    }

    // Map deckList to query promises
    const queryPromises = deckList.map(async (cardName) => {
      const result = await pool.query('SELECT * FROM cards WHERE name LIKE $1', [`%${cardName}%`]);
      if (result.rows.length === 0) {
        console.warn(`No data found for card: ${cardName}`);
        return null; // Handle missing data gracefully
      }
      console.log(`Success for ${cardName}`);
      return result.rows[0];
    });

    // Wait for all promises to resolve
    const results = await Promise.all(queryPromises);

    // Filter out null results if necessary
    return results.filter((result) => result !== null);
  } catch (error) {
    console.error('Error querying PostgreSQL:', error);
    throw error; // Rethrow to allow calling code to handle
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


//function prepCardURL(card){
//  const num = card.substring(0, card.indexOf(' '))
//  card = card.substring(card.indexOf(' ') + 1);
//  console.log(num + " copies of " + card)
//  
//  //replace space with + for URL
//  const cardURL = "https://api.scryfall.com/cards/named?fuzzy=" + card.replace(/ /g,"+")
//  return cardURL
//}
//
