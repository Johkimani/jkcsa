const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration: ALTER COLUMN year TYPE VARCHAR(20)...');
    await pool.query('ALTER TABLE election_terms ALTER COLUMN year TYPE VARCHAR(20)');
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
