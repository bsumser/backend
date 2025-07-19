// app/db.js
import pkg from 'pg';
import { config } from './config.js';

// ✅ ADD THIS DEBUGGING BLOCK
console.log("--- Database Connection Details from Node.js Environment ---");
console.log(`Attempting to connect to host:     ${process.env.POSTGRES_HOST}`);
console.log(`Attempting to connect to database: ${process.env.POSTGRES_DB}`);
console.log(`Attempting to connect as user:     ${process.env.POSTGRES_USER}`);
console.log("----------------------------------------------------------");
// ✅ END DEBUGGING BLOCK

const { Pool } = pkg;

const db = new Pool(config.db);

db.on('connect', () => {
  console.log('PostgreSQL pool connected successfully!');
});


export { db };
