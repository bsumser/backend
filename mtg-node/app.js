// app/app.js
import express from 'express';
import routes from './routes.js'; // Assuming this imports an Express Router or similar

const app = express();

// --- Other Middleware (if any) ---
// Example: To parse JSON request bodies
app.use(express.json());
// Example: To parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use(routes); // This assumes `routes` is an Express Router instance

// --- Error Handling Middleware (optional but recommended) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Export the app for testing purposes
export { app };