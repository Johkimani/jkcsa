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

    // Ensure contact is unique when not null to prevent duplicate contacts
    const idx = `
      CREATE UNIQUE INDEX IF NOT EXISTS unique_officials_contact_idx
      ON officials (contact)
      WHERE contact IS NOT NULL;
    `;
    try {
      await pool.query(idx);
      console.log('✓ Unique index on contact ensured (non-null contacts)');
    } catch (idxErr) {
      console.warn('Unique index creation failed, attempting to clean duplicate contacts...');
      // Find duplicate contacts
      const dupQuery = `
        SELECT contact, array_agg(id ORDER BY id) AS ids, count(*) as cnt
        FROM officials
        WHERE contact IS NOT NULL
        GROUP BY contact
        HAVING COUNT(*) > 1;
      `;
      const dupRes = await pool.query(dupQuery);
      if (dupRes.rows.length === 0) {
        throw idxErr; // nothing to do
      }

      // For each duplicate group, keep the smallest id and NULL-out contact for others
      for (const row of dupRes.rows) {
        const ids = row.ids;
        const keep = ids[0];
        const remove = ids.slice(1);
        console.log(`Cleaning duplicate contact '${row.contact}': keeping id=${keep}, nulling ids=${remove.join(',')}`);
        await pool.query('UPDATE officials SET contact = NULL WHERE id = ANY($1::int[])', [remove]);
      }

      // Try creating index again
      await pool.query(idx);
      console.log('✓ Unique index on contact ensured after cleaning duplicates');
    }
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
