// app/config.js
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

let cert = '';
const path = './ca-certificate.crt';

// Only read cert if not in test environment
if (process.env.NODE_ENV !== 'test' && fs.existsSync(path)) {
  cert = fs.readFileSync(path).toString();
}

export const config = {
  db: {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASS,
    port: process.env.POSTGRES_PORT || 5432,
    ssl: {
      rejectUnauthorized: false,
      cert,
    },
  },
};

