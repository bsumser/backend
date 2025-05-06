// app/config.js
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  db: {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASS,
    port: process.env.POSTGRES_PORT || 5432,
    ssl: {
      rejectUnauthorized: false,
      cert: fs.readFileSync('./ca-certificate.crt').toString(),
    },
  },
};