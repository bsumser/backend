// app/server.js
import { app } from './app.js';

const PORT = process.env.PORT || 8081;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { server };