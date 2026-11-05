require('dotenv').config();
const { Pool, types } = require('pg');

// pg returns NUMERIC and BIGINT (e.g. COUNT(*)) as strings by default.
// Prices and counts are small, so parse them into plain JS numbers.
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep every session in UTC so timestamps are handled consistently.
    options: '-c timezone=UTC',
    // Set DATABASE_SSL=true for hosted databases that require TLS.
    ...(process.env.DATABASE_SSL === 'true' ? { ssl: true } : {}),
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Every handler runs its SQL directly with  pool.query('SELECT ...', [values]).
// $1, $2 ... in the SQL are replaced by the values array (this prevents SQL injection).
//
// Handlers that need several statements to succeed or fail together use:
//     const client = await pool.connect();
//     await client.query('BEGIN'); ... await client.query('COMMIT');   (or 'ROLLBACK' on error)

const connectDB = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
        }
        await pool.query('SELECT 1');
        console.log('Database Connected');

        const { rows } = await pool.query("SELECT to_regclass('public.companies') AS companies");
        if (!rows[0].companies) {
            console.warn('Database tables not found. Run "npm run db:init" to create them.');
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.pool = pool;
