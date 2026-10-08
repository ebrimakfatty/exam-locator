// PostgreSQL connection pool - shared across the app
require('dotenv').config();
const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings so timezones can't shift the day.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
