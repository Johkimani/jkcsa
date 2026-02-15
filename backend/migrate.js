const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Running migration: Adding contact column to officials table...');
    
    const query = `
      ALTER TABLE officials 
      ADD COLUMN IF NOT EXISTS contact VARCHAR(100);
    `;
    
    await pool.query(query);
    console.log('✓ Migration successful! contact column added to officials table.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
