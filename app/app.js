// app/app.js
import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();

// Middleware setup
app.use(cors());
app.use(routes);

// Export the app for testing purposes
export { app };