const { Pool } = require("pg");
require("dotenv").config();

/* ***************
 * Connection Pool Setup
 * *************** */
let pool;

// Determine which SSL object to use based on environment
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}else {
 // 🚨 FIX: Add SSL configuration for production deployment (Render)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
 }, 
});
}

/* **************************************
 * Conditional Export for Development/Production
 * We export the pool by default, or an object with a query function
 * that logs the queries during development for debugging.
 * **************************************/
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  // Export object with query function for development logging
  module.exports = {
    async query(text, params) {
      try {
        const res = await pool.query(text, params);
        console.log("executed query", { text: text.substring(0, 50) }); // Log first 50 chars
        return res;
      } catch (error) {
        console.error("error in query", { text: text.substring(0, 50) });
        throw error;
      }
    },
  };
} else {
  // Export the pool directly for production
  module.exports = pool;
}
