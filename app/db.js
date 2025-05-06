// app/db.js
import pkg from 'pg';
import { config } from './config.js';

const { Pool } = pkg;

const db = new Pool(config.db);

export { db };