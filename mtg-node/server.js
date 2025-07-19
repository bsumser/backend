// app/server.js
import { app } from './app.js';

const PORT = process.env.PORT || 8081;
let server;

// Exporting the listen function for starting the server
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
export { server };