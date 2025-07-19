// app/tests/app.test.js

import request from 'supertest';
import { app } from '../app.js';

const goodDeck = "4 Goldspan Dragon 4 Hinata, Dawn-Crowned 4 Expressive Iteration 1 Abrade 1 Dragon's Fire 2 Flame-Blessed Bolt 4 Jwari Disruption 4 Magma Opus 2 Make Disappear 1 Negate 2 Spikefield Hazard 1 Valorous Stance 4 Voltage Surge 4 Fable of the Mirror-Breaker 1 Eiganjo, Seat of the Empire 1 Hall of Storm Giants 4 Hengegate Pathway 1 Mountain 4 Needleverge Pathway 1 Otawara, Soaring City 4 Riverglide Pathway 1 Sokenzan, Crucible of Defiance 4 Stormcarved Coast 1 Sundown Pass";

let server;

beforeAll((done) => {
  server = app.listen(3000, () => {
    console.log('Test server running on port 3000');
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    console.log('Test server closed');
    done();
  });
});

describe('GET /health', () => {
  it('should return a status 200 when the server is up', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});

describe('GET /deck', () => {
  it('should return 400 for an invalid deck', async () => {
    const response = await request(app).get('/deck?invalid');
    expect(response.status).toBe(400);
  });

  // --- CHANGE THIS TEST ---
  it('should return an object with a deck array for a valid short deck', async () => {
    const deckQuery = encodeURIComponent("1 Abrade 1 Dragon's Fire");
    const response = await request(app).get(`/deck?deck=${deckQuery}`);
    expect(response.status).toBe(200);
    // Check that the body is an object
    expect(typeof response.body).toBe('object');
    // Check that the 'deck' property of the body is an array
    expect(Array.isArray(response.body.deck)).toBe(true);
    // Optionally, check that the array is not empty
    expect(response.body.deck.length).toBeGreaterThan(0);
  });

  // --- CHANGE THIS TEST ---
  it('should return an object with a deck array for a valid large deck', async () => {
    const deckQuery = encodeURIComponent(goodDeck);
    const response = await request(app).get(`/deck?deck=${deckQuery}`);
    expect(response.status).toBe(200);
    // Check that the body is an object
    expect(typeof response.body).toBe('object');
    // Check that the 'deck' property of the body is an array
    expect(Array.isArray(response.body.deck)).toBe(true);
    // Optionally, check that the array is not empty
    expect(response.body.deck.length).toBeGreaterThan(0);
  });
});