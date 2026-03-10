// Migration script to add election terms columns to existing database
const pool = require('./config/db');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');
    
    // Create election_terms table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS election_terms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ election_terms table created');
    
    // Add election_term_id column to officials if it doesn't exist
    await client.query(`
      ALTER TABLE officials ADD COLUMN IF NOT EXISTS election_term_id INTEGER REFERENCES election_terms(id) ON DELETE SET NULL
    `);
    console.log('✓ election_term_id column added to officials');
    
    // Add status column to officials if it doesn't exist
    await client.query(`
      ALTER TABLE officials ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived'))
    `);
    console.log('✓ status column added to officials');
    
    // Set status = 'active' for existing officials without a status
    await client.query(`
      UPDATE officials SET status = 'active' WHERE status IS NULL
    `);
    console.log('✓ Existing officials set to active status');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
