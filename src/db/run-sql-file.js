// Runs an arbitrary .sql file against the database.
// Usage: node src/db/run-sql-file.js <path-to-sql-file>
const fs = require('fs');
const path = require('path');
const db = require('./index');

const filePath = process.argv[2];

if (!filePath) {
    console.error('Usage: node src/db/run-sql-file.js <path-to-sql-file>');
    process.exit(1);
}

async function run() {
    const sql = fs.readFileSync(path.resolve(filePath), 'utf8');
    try {
        await db.query(sql);
        console.log(`Ran ${filePath} successfully.`);
    } catch (err) {
        console.error(`Failed to run ${filePath}:`, err.message);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
}

run();
