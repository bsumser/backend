import request from 'supertest';
import { app } from '../app.js'; // Use named import if you exported like `export { app }`

let server;

beforeAll((done) => {
  // Start the server before any tests are run
  server = app.listen(3000, () => {
    console.log('Test server running on port 3000');
    done(); // Signal Jest that the setup is complete and tests can start
  });
});

afterAll((done) => {
  // Close the server after tests are done
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

  it('should return an array of cards when the deck query is valid', async () => {
    const deckQuery = encodeURIComponent("1 Abrade 1 Dragon's Fire");
    const response = await request(app).get(`/deck?deck=${deckQuery}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});