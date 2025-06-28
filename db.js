// db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render will set this
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
