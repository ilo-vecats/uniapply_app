

const { Pool } = require("pg");
require("dotenv").config();

//  Require DB_URL explicitly (prevents silent localhost fallback)
if (!process.env.DB_URL) {
  console.error(" DB_URL is missing in environment variables.");
  process.exit(1);
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection success
pool.on("connect", () => {
  console.log("Connected to PostgreSQL (Neon)");
});

// Connection failure
pool.on("error", (err) => {
  console.error("Database connection error:", err);
  process.exit(1);
});


async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", {
      text,
      duration: `${duration}ms`,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
};
