// Run this once to create tables: npm run db:init
const fs = require('fs');
const path = require('path');
const db = require('./index');

async function init() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
        await db.query(schema);
        console.log('Database schema created successfully.');
    } catch (err) {
        console.error('Failed to run schema:', err.message);
    } finally {
        await db.pool.end();
    }
}

init();
