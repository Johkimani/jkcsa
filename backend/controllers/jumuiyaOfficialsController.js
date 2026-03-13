const { officialSchema, termSchema } = require('../schemas/zodSchemas');
const { z } = require('zod');
const { 
  normalizePhone, 
  isValidPhone, 
  deleteFile, 
  formatPhotoUrl, 
  syncCurrentTerm,
  formatPhoneForExcel 
} = require('../utils/helpers');

const VALID_JUMUIYAS = [
  'St. Antony',
  'St. Augustine',
  'St. Catherine',
  'St. Dominic',
  'St. Elizabeth',
  'Maria Gorreti',
  'St. Monica'
];

const VALID_ROLES = [
  'Chairperson',
  'Ass Chairperson',
  'Organizing Secretary',
  'Treasurer',
  'Secretary',
  'Ass Secretary',
  'Liturgist',
  'Ass Liturgist'
];

/**
 * Shared SQL sorting logic for Jumuiya officials.
 * Groups by Jumuiya (alphabetically, ignoring "St.") and 
 * orders by position superiority (Chairperson down to Liturgist).
 */
const JUMUIYA_SORT_SQL = `
ORDER BY 
  CASE 
    WHEN o.category = 'St. Antony' THEN 1
    WHEN o.category = 'St. Augustine' THEN 2
    WHEN o.category = 'St. Catherine' THEN 3
    WHEN o.category = 'St. Dominic' THEN 4
    WHEN o.category = 'St. Elizabeth' THEN 5
    WHEN o.category = 'Maria Gorreti' THEN 6
    WHEN o.category = 'St. Monica' THEN 7
    ELSE 8
  END,
  CASE
    WHEN o.position = 'Chairperson' THEN 1
    WHEN o.position = 'Ass Chairperson' THEN 2
    WHEN o.position = 'Organizing Secretary' THEN 3
    WHEN o.position = 'Treasurer' THEN 4
    WHEN o.position = 'Secretary' THEN 5
    WHEN o.position = 'Ass Secretary' THEN 6
    WHEN o.position = 'Liturgist' THEN 7
    WHEN o.position = 'Ass Liturgist' THEN 8
    ELSE 9
  END`;

/**
 * Fetches active or archived Jumuiya officials.
 */
const getAllJumuiyaOfficials = async (req, res) => {
  try {
    const termId = req.query.term_id;
    const includeArchived = req.query.include_archived === 'true';
    const termOfService = req.query.term_of_service;
    
    let query;
    let params = [];

    if (termId) {
      query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.election_term_id = $1 OR o.status = 'active' OR o.status IS NULL)
        AND (o.status = 'active' OR o.status IS NULL)`;
      params.push(termId);
      if (termOfService) {
        query += ` AND o.term_of_service = $2`;
        params.push(termOfService);
      }
      query += ` ${JUMUIYA_SORT_SQL}`;
    } else if (includeArchived) {
      query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      if (termOfService) {
        query += ` WHERE o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ORDER BY o.status, et.year DESC ${JUMUIYA_SORT_SQL.replace('ORDER BY', ',')}`;
    } else {
      query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
      if (termOfService) {
        query += ` AND o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ${JUMUIYA_SORT_SQL}`;
    }

    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching jumuiya officials:', error);
    res.status(500).json({ error: 'Failed to fetch jumuiya officials' });
  }
};

const getJumuiyaOfficialById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM jumuiya_officials WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching jumuiya official:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch official' });
  }
};

const createJumuiyaOfficial = async (req, res) => {
  try {
    const validated = officialSchema.parse(req.body);
    const { name, category, position, contact, term_of_service } = validated;

    const normalizedContact = normalizePhone(contact);
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    if (normalizedContact) {
      const dup = await pool.query(
        "SELECT id FROM jumuiya_officials WHERE contact = $1 AND (status = 'active' OR status IS NULL)",
        [normalizedContact]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use by another official' });
      }
    }

    if (!VALID_JUMUIYAS.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid Jumuiya. Must be one of: ${VALID_JUMUIYAS.join(', ')}` });
    }

    if (!position || !VALID_ROLES.includes(position)) {
      return res.status(400).json({ success: false, message: `Invalid Role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    // Check for exact Jumuiya + Role combination limits
    const posDup = await pool.query(
      "SELECT name FROM jumuiya_officials WHERE category = $1 AND position = $2 AND (status = 'active' OR status IS NULL)",
      [category, position]
    );

    if (posDup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `The position '${position}' for ${category} is already occupied by ${posDup.rows[0].name}`
      });
    }

    let photoUrl = req.file ? formatPhotoUrl(req.file.path) : null;

    const currentTerm = await pool.query("SELECT id FROM election_terms WHERE is_current = TRUE");
    const termId = currentTerm.rows.length > 0 ? currentTerm.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO jumuiya_officials (name, category, position, contact, photo, election_term_id, status, term_of_service) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7) RETURNING *`,
      [name, category, position, normalizedContact || null, photoUrl, termId, term_of_service || null]
    );

    await syncCurrentTerm(term_of_service);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error creating jumuiya official:', error);
    res.status(500).json({ success: false, message: 'Failed to create official' });
  }
};

const updateJumuiyaOfficial = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = officialSchema.partial().parse(req.body);
    const { name, category, position, contact, term_of_service } = validated;

    const existing = await pool.query('SELECT * FROM jumuiya_officials WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const currentCategory = category || existing.rows[0].category;
    const currentPosition = position || existing.rows[0].position;

    if (category && !VALID_JUMUIYAS.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid Jumuiya. Must be one of: ${VALID_JUMUIYAS.join(', ')}` });
    }

    if (position && !VALID_ROLES.includes(position)) {
      return res.status(400).json({ success: false, message: `Invalid Role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const normalizedContact = contact ? normalizePhone(contact) : null;
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    if (normalizedContact) {
      const dup = await pool.query(
        "SELECT id FROM jumuiya_officials WHERE contact = $1 AND id != $2 AND (status = 'active' OR status IS NULL)",
        [normalizedContact, id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use' });
      }
    }

    // Limit check for category+position combo during an update
    if (category || position) {
      const posDup = await pool.query(
        "SELECT name FROM jumuiya_officials WHERE category = $1 AND position = $2 AND id != $3 AND (status = 'active' OR status IS NULL)",
        [currentCategory, currentPosition, id]
      );
      if (posDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The position '${currentPosition}' for ${currentCategory} is already occupied by ${posDup.rows[0].name}`
        });
      }
    }

    let photoUrl = existing.rows[0].photo;
    if (req.file) {
      if (existing.rows[0].photo) {
        deleteFile(existing.rows[0].photo.replace(/^\//, './'));
      }
      photoUrl = formatPhotoUrl(req.file.path);
    }

    const result = await pool.query(
      `UPDATE jumuiya_officials SET name = COALESCE($1, name), category = COALESCE($2, category),
       position = COALESCE($3, position), contact = COALESCE($4, contact),
       photo = COALESCE($5, photo), term_of_service = COALESCE($6, term_of_service),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, category, position, normalizedContact, photoUrl, term_of_service || null, id]
    );

    if (term_of_service) {
      await syncCurrentTerm(term_of_service);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error updating jumuiya official:', error);
    res.status(500).json({ success: false, message: 'Failed to update official' });
  }
};

const deleteJumuiyaOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM jumuiya_officials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const official = result.rows[0];

    if (official.photo) {
      const filePath = official.photo.replace(/^\//, './');
      deleteFile(filePath);
    }

    await pool.query('DELETE FROM jumuiya_officials WHERE id = $1', [id]);
    res.json({ success: true, message: 'Official deleted successfully' });
  } catch (error) {
    console.error('Error deleting jumuiya official:', error);
    res.status(500).json({ success: false, message: 'Failed to delete official' });
  }
};

const exportJumuiyaOfficials = async (req, res) => {
  try {
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, et.name as term_name, et.year as term_year, o.term_of_service
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
    let params = [];
    if (termOfService) {
      query += ` AND o.term_of_service = $1`;
      params.push(termOfService);
    }
    query += ` ${JUMUIYA_SORT_SQL}`;

    const result = await pool.query(query, params);

    const headers = selectedFields.map(f => f.charAt(0).toUpperCase() + f.slice(1));
    const data = result.rows.map(row => {
      const obj = {};
      selectedFields.forEach(field => {
        let value = row[field] || '';
        if (field === 'contact' && value) {
          value = formatPhoneForExcel(value);
        }
        obj[field] = value;
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const wsData = [headers];
    data.forEach(row => {
      const rowData = selectedFields.map(field => row[field] || '');
      wsData.push(rowData);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = selectedFields.map((field, idx) => {
      const headerLength = headers[idx].length;
      const maxContentLength = Math.max(...data.map(row => String(row[field] || '').length), headerLength);
      const width = Math.max(maxContentLength + 2, 15);
      return { wch: width };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Jumuiya Officials');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="jumuiya_officials.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting jumuiya officials:', error);
    res.status(500).json({ success: false, message: 'Failed to export jumuiya officials' });
  }
};

const exportArchivedJumuiyaOfficials = async (req, res) => {
  try {
    const { termId } = req.params;
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, o.status, et.name as term_name, et.year as term_year, o.term_of_service
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'archived'`;
    let params = [];
    if (termId) {
      query += ` AND o.election_term_id = $1`;
      params.push(termId);
    }
    if (termOfService) {
      query += (termId ? ` AND` : ` AND`) + ` (o.term_of_service = $${params.length + 1} OR et.name = $${params.length + 1})`;
      params.push(termOfService);
    }
    query += ` ${JUMUIYA_SORT_SQL}`;

    const result = await pool.query(query, params);

    const formatPhoneForExcel = (phone) => {
      if (!phone) return '';
      const digits = phone.replace(/\\D/g, '');
      if (digits.length > 9) {
        return '0' + digits.slice(-9);
      }
      return phone;
    };

    const headers = selectedFields.map(f => f.charAt(0).toUpperCase() + f.slice(1));
    const data = result.rows.map(row => {
      const obj = {};
      selectedFields.forEach(field => {
        let value = row[field] || '';
        if (field === 'contact' && value) {
          value = formatPhoneForExcel(value);
        }
        obj[field] = value;
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const wsData = [headers];
    data.forEach(row => {
      const rowData = selectedFields.map(field => row[field] || '');
      wsData.push(rowData);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = selectedFields.map((field, idx) => {
      const headerLength = headers[idx].length;
      const maxContentLength = Math.max(...data.map(row => String(row[field] || '').length), headerLength);
      const width = Math.max(maxContentLength + 2, 15);
      return { wch: width };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Archived Jumuiya Officials');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="archived_jumuiya_officials.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting archived jumuiya officials:', error);
    res.status(500).json({ success: false, message: 'Failed to export archived officials' });
  }
};

const archiveCurrentJumuiyaOfficials = async (req, res) => {
  const client = await pool.connect();
  try {
    const { election_term_id, name, year, start_date, end_date, description, category } = req.body;

    await client.query('BEGIN');

    let termId = election_term_id;

    if (!termId) {
      if (!name || !year || !start_date) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Election term details required when no term_id provided'
        });
      }

      await client.query('UPDATE election_terms SET is_current = FALSE');

      const termResult = await client.query(
        `INSERT INTO election_terms (name, year, start_date, end_date, description, is_current)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [name, year, start_date, end_date || null, description || null]
      );
      termId = termResult.rows[0].id;
    } else {
      const termCheck = await client.query('SELECT * FROM election_terms WHERE id = $1', [termId]);
      if (termCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Election term not found' });
      }

      await client.query('UPDATE election_terms SET is_current = FALSE');
      await client.query('UPDATE election_terms SET is_current = TRUE WHERE id = $1', [termId]);
    }

    let activeFilter = "status = 'active' OR status IS NULL";
    let params = [];
    if (category) {
       activeFilter = "(status = 'active' OR status IS NULL) AND category = $1";
       params.push(category);
    }

    const currentOfficials = await client.query(
      `SELECT * FROM jumuiya_officials WHERE ${activeFilter}`,
      params
    );

    if (currentOfficials.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No active officials to archive'
      });
    }

    const archivePromises = currentOfficials.rows.map(official =>
      client.query(
        `UPDATE jumuiya_officials SET status = 'archived', election_term_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [termId, official.id]
      )
    );

    await Promise.all(archivePromises);

    const termInfo = await client.query('SELECT * FROM election_terms WHERE id = $1', [termId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully archived ${currentOfficials.rows.length} officials to "${termInfo.rows[0].name}"`,
      data: { archived_count: currentOfficials.rows.length, election_term: termInfo.rows[0] }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error archiving officials:', error);
    res.status(500).json({ success: false, message: `Failed to archive officials: ${error.message}` });
  } finally {
    client.release();
  }
};

const getJumuiyaOfficialsByTerm = async (req, res) => {
  try {
    const { termId } = req.params;
    const includeArchived = req.query.include_archived === 'true';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let queryBase;
    let params = [];
    let countQuery;

    if (termId) {
      queryBase = `
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.election_term_id = $1 AND o.status = 'archived'`;
      params = [termId];
    } else if (req.query.only_archived === 'true') {
      queryBase = `
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'archived'`;
      params = [];
    } else if (includeArchived) {
      queryBase = `
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      params = [];
    } else {
      queryBase = `
        FROM jumuiya_officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'active' OR o.status IS NULL`;
      params = [];
    }

    countQuery = `SELECT COUNT(*) ${queryBase}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    const dataQuery = `
      SELECT o.*, et.name as term_name, et.year as term_year 
      ${queryBase} 
      ${termId || req.query.only_archived === 'true' ? `ORDER BY et.year DESC ${JUMUIYA_SORT_SQL.replace('ORDER BY', ',')}` : JUMUIYA_SORT_SQL}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const result = await pool.query(dataQuery, [...params, limit, offset]);

    res.json({ 
      success: true, 
      data: result.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching officials by term:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch officials' });
  }
};

const restoreArchivedJumuiyaOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;

    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Official IDs array is required'
      });
    }

    const officialsToRestore = await pool.query(
      `SELECT name, category, position FROM jumuiya_officials WHERE id = ANY($1) AND position IS NOT NULL AND position != ''`,
      [officialIds]
    );

    if (officialsToRestore.rows.length > 0) {
      const positionsByCategory = {};
      
      const seen = new Set();
      for (const o of officialsToRestore.rows) {
        const key = `${o.category}-${o.position}`;
        if (seen.has(key)) {
          return res.status(409).json({
            success: false,
            message: `Multiple officials in the selection have the same position (${o.position}) in ${o.category}`
          });
        }
        seen.add(key);
        
        if (!positionsByCategory[o.category]) {
           positionsByCategory[o.category] = [];
        }
        positionsByCategory[o.category].push(o.position);
      }

      for (const [category, positions] of Object.entries(positionsByCategory)) {
         const dupPos = await pool.query(
           `SELECT name, position FROM jumuiya_officials WHERE category = $1 AND position = ANY($2) AND status = 'active' AND id != ANY($3)`,
           [category, positions, officialIds]
         );

         if (dupPos.rows.length > 0) {
           const conflict = dupPos.rows[0];
           return res.status(409).json({
             success: false,
             message: `Cannot restore: Position '${conflict.position}' in ${category} is already occupied by ${conflict.name} in the active list.`
           });
         }
      }
    }

    const result = await pool.query(
      `UPDATE jumuiya_officials SET status = 'active', election_term_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) RETURNING *`,
      [officialIds]
    );

    res.json({
      success: true,
      message: `Successfully restored ${result.rows.length} officials`,
      data: result.rows
    });
  } catch (error) {
    console.error('Error restoring jumuiya officials:', error);
    res.status(500).json({ success: false, message: 'Failed to restore officials' });
  }
};

const deleteArchivedJumuiyaOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM jumuiya_officials WHERE id = $1 AND status = 'archived' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archived official not found' });
    }

    if (result.rows[0].photo) {
      if (!result.rows[0].photo.startsWith('http')) {
        const photoPath = path.join(__dirname, '..', result.rows[0].photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
    }

    res.json({ success: true, message: 'Archived official deleted successfully' });
  } catch (error) {
    console.error('Error deleting archived official:', error);
    res.status(500).json({ success: false, message: 'Failed to delete archived official' });
  }
};

const bulkDeleteArchivedJumuiyaOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;
    
    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Official IDs are required' });
    }

    // Get photos before deletion to clean up files
    const snapshot = await pool.query(
      `SELECT photo FROM jumuiya_officials WHERE id = ANY($1) AND status = 'archived' AND photo IS NOT NULL`,
      [officialIds]
    );

    const result = await pool.query(
      `DELETE FROM jumuiya_officials WHERE id = ANY($1) AND status = 'archived' RETURNING *`,
      [officialIds]
    );

    // Clean up photos
    for (const row of snapshot.rows) {
      if (row.photo && !row.photo.startsWith('http')) {
        const photoPath = path.join(__dirname, '..', row.photo);
        if (fs.existsSync(photoPath)) {
            try { fs.unlinkSync(photoPath); } catch (e) { console.error('Error deleting photo:', e); }
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.rows.length} archived officials`,
      data: { deletedCount: result.rows.length }
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ success: false, message: 'Failed to delete archived officials' });
  }
};

module.exports = {
  getAllJumuiyaOfficials,
  getJumuiyaOfficialById,
  createJumuiyaOfficial,
  updateJumuiyaOfficial,
  deleteJumuiyaOfficial,
  archiveCurrentJumuiyaOfficials,
  getJumuiyaOfficialsByTerm,
  restoreArchivedJumuiyaOfficials,
  exportJumuiyaOfficials,
  exportArchivedJumuiyaOfficials,
  deleteArchivedJumuiyaOfficial,
  bulkDeleteArchivedJumuiyaOfficials
};
