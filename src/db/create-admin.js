// Creates (or resets the password of) an admin account.
// Usage: npm run create-admin -- <username> <password>
const bcrypt = require('bcrypt');
const db = require('./index');

const [username, password] = process.argv.slice(2);

async function run() {
    if (!username || !password) {
        console.error('Usage: npm run create-admin -- <username> <password>');
        process.exitCode = 1;
        return;
    }
    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exitCode = 1;
        return;
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
             ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
            [username, hash]
        );
        console.log(`Admin "${username}" is ready.`);
    } catch (err) {
        console.error('Failed to create admin:', err.message);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
}
run();
