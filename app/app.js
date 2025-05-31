// app/app.js
import express from 'express';
import cors from 'cors'; // <-- Make sure to import cors here!
import routes from './routes.js'; // Assuming this imports an Express Router or similar

const app = express();

// --- CORS Configuration ---
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://bsumser.dev',      // Your deployed frontend domain
      'http://localhost:5173',    // Your local Vite development URL
      'http://localhost:3000'     // Another common local React development URL
      // Add any other specific origins your frontend might run from
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Block the request
    }
  },
  methods: 'GET', // Allowed HTTP methods for your API
  credentials: true, // If your frontend sends cookies (e.g., for authentication)
  optionsSuccessStatus: 204 // For preflight requests
};

app.use(cors(corsOptions)); // <-- Apply the CORS middleware here

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