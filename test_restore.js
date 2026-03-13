
const pool = require('./backend/config/db');

async function testRestore() {
  try {
    // 1. Find some archived CSA officials
    const archived = await pool.query("SELECT id FROM officials WHERE status = 'archived' LIMIT 1");
    if (archived.rows.length === 0) {
      console.log('No archived officials found to test with.');
      process.exit(0);
    }
    const id = archived.rows[0].id;
    console.log(`Attempting to restore official ID: ${id}`);

    // Simulate req.body
    const officialIds = [id];

    // Mirroring officialsController.js logic
    const contacts = await pool.query(
      `SELECT contact FROM officials WHERE id = ANY($1) AND contact IS NOT NULL AND contact != ''`,
      [officialIds]
    );

    if (contacts.rows.length > 0) {
       const dup = await pool.query(
        `SELECT id FROM officials WHERE contact = ANY($1) AND status = 'active' AND id != ANY($2)`,
        [contacts.rows.map(c => c.contact), officialIds]
      );
      if (dup.rows.length > 0) {
        console.log('Conflict: Contact already in use');
      }
    }

    const officialsToRestore = await pool.query(
      `SELECT name, position FROM officials WHERE id = ANY($1) AND position IS NOT NULL AND position != ''`,
      [officialIds]
    );

    if (officialsToRestore.rows.length > 0) {
      const positions = officialsToRestore.rows.map(o => o.position);
      const dupPos = await pool.query(
        `SELECT name, position FROM officials WHERE position = ANY($1) AND status = 'active' AND id != ANY($2)`,
        [positions, officialIds]
      );
      if (dupPos.rows.length > 0) {
        console.log('Conflict: Position already in use');
      }
    }

    const result = await pool.query(
      `UPDATE officials SET status = 'active', election_term_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) RETURNING *`,
      [officialIds]
    );

    console.log('Success!', result.rows);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

testRestore();
