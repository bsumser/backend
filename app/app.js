// app/app.js
import express from 'express';
// import cors from 'cors'; // You can remove this import if not used elsewhere
import routes from './routes.js';

const app = express();

// Middleware setup
// app.use(cors()); // <-- REMOVE OR COMMENT OUT THIS LINE
app.use(routes);

// Export the app for testing purposes
export { app };