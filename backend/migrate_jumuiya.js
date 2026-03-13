const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting Jumuiya Officials Database Migration...');
    
    // Read the schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL schema against the connected pool
    await pool.query(schema);
    
    console.log('Migration completed successfully!');
    console.log('The jumuiya_officials table has been created.');
    
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    // Close the pool connection so the script exits
    await pool.end();
    process.exit(0);
  }
}

runMigration();
