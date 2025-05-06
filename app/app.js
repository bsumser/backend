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

// Exporting the listen function for starting the server
if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}