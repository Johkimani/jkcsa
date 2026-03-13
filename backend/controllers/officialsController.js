const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { officialSchema, termSchema } = require('../schemas/zodSchemas');
const { z } = require('zod');

const CATEGORY_LIMITS = {
  'Executive': 6,
  'Jumuiya Coordinators': 2,
  'Bible Coordinators': 2,
  'Rosary': 2,
  'Pamphlet Managers': 2,
  'Project Managers': 2,
  'Liturgist': 2,
  'Choir Officials': 2,
  'Instrument Managers': 2,
  'Liturgical Dancers': 2,
  'Catechist': 1
};

const VALID_CATEGORIES = Object.keys(CATEGORY_LIMITS);

const { parsePhoneNumberFromString } = require('libphonenumber-js');

const normalizePhone = (phone) => {
  if (!phone) return null;
  const s = String(phone).trim();
  let pn = parsePhoneNumberFromString(s);
  if (!pn) pn = parsePhoneNumberFromString(s, 'KE');
  if (!pn || !pn.isValid()) return null;
  return pn.number;
};

const isValidPhone = (phone) => {
  if (!phone) return true;
  const pn = parsePhoneNumberFromString(String(phone));
  if (pn) return pn.isValid();
  const pn2 = parsePhoneNumberFromString(String(phone), 'KE');
  return pn2 ? pn2.isValid() : false;
};

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const formatPhotoUrl = (filePath) => {
  if (filePath) {
    return filePath.replace(/\\/g, '/').replace('./', '/');
  }
  return null;
};

const syncCurrentTerm = async (termOfService) => {
  if (!termOfService) return;
  try {
    const current = await pool.query('SELECT * FROM election_terms WHERE is_current = TRUE');
    if (current.rows.length > 0) {
      const term = current.rows[0];
      if (term.year !== termOfService) {
        await pool.query(
          'UPDATE election_terms SET year = $1, name = $2 WHERE id = $3',
          [termOfService, `${termOfService} Committee`, term.id]
        );
      }
    }
  } catch (err) {
    console.error('Error syncing current term:', err);
  }
};

// ==================== ELECTION TERM MANAGEMENT ====================

const getAllElectionTerms = async (req, res) => {
  try {
    const query = `
      SELECT et.*, 
        (SELECT COUNT(*) FROM officials o WHERE o.election_term_id = et.id AND o.status = 'archived') as archived_csa_count,
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count
      FROM election_terms et 
      ORDER BY et.is_current DESC, et.year DESC, et.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching election terms:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch election terms' });
  }
};

const getCurrentElectionTerm = async (req, res) => {
  try {
    const query = `
      SELECT et.*, 
        (SELECT COUNT(*) FROM officials o WHERE o.election_term_id = et.id AND o.status = 'archived') as archived_csa_count,
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count
      FROM election_terms et 
      WHERE et.is_current = TRUE
    `;
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching current election term:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch current election term' });
  }
};

const createElectionTerm = async (req, res) => {
  try {
    const validated = termSchema.parse(req.body);
    const { name, year, start_date, end_date, description, set_as_current } = validated;

    if (set_as_current) {
      await pool.query('UPDATE election_terms SET is_current = FALSE');
    }

    const result = await pool.query(
      `INSERT INTO election_terms (name, year, start_date, end_date, description, is_current)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, year, start_date, end_date, description, set_as_current || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error creating election term:', error);
    res.status(500).json({ success: false, message: 'Failed to create election term' });
  }
};

const updateElectionTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = termSchema.partial().parse(req.body);
    const { name, year, start_date, end_date, description, is_current } = validated;

    const existing = await pool.query('SELECT * FROM election_terms WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election term not found' });
    }

    if (is_current) {
      await pool.query('UPDATE election_terms SET is_current = FALSE');
    }

    const result = await pool.query(
      `UPDATE election_terms 
       SET name = COALESCE($1, name), year = COALESCE($2, year),
           start_date = COALESCE($3, start_date), end_date = COALESCE($4, end_date),
           description = COALESCE($5, description), is_current = COALESCE($6, is_current)
       WHERE id = $7 RETURNING *`,
      [name, year, start_date, end_date, description, is_current, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error updating election term:', error);
    res.status(500).json({ success: false, message: 'Failed to update election term' });
  }
};

const deleteElectionTerm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const existing = await client.query('SELECT * FROM election_terms WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election term not found' });
    }

    const term = existing.rows[0];

    if (term.is_current) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current election term. Set another term as current first.'
      });
    }

    // First, get all archived officials for this term to delete their photos
    const archivedOfficials = await client.query(
      'SELECT photo FROM officials WHERE election_term_id = $1 AND status = $2',
      [id, 'archived']
    );

    // Delete photo files
    for (const official of archivedOfficials.rows) {
      if (official.photo) {
        const filePath = official.photo.replace(/^\//, './');
        deleteFile(filePath);
      }
    }

    // Delete all archived officials for this term
    await client.query(
      'DELETE FROM officials WHERE election_term_id = $1 AND status = $2',
      [id, 'archived']
    );

    // Delete the election term
    await client.query('DELETE FROM election_terms WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Election term and all archived officials deleted successfully' });
  } catch (error) {
    console.error('Error deleting election term:', error);
    res.status(500).json({ success: false, message: 'Failed to delete election term' });
  } finally {
    client.release();
  }
};

const archiveCurrentOfficials = async (req, res) => {
  const client = await pool.connect();
  try {
    const { election_term_id, name, year, start_date, end_date, description } = req.body;

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

    const currentOfficials = await client.query(
      "SELECT * FROM officials WHERE status = 'active' OR status IS NULL"
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
        `UPDATE officials SET status = 'archived', election_term_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
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

const getOfficialsByTerm = async (req, res) => {
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
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.election_term_id = $1 AND o.status = 'archived'`;
      params = [termId];
    } else if (req.query.only_archived === 'true') {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'archived'`;
      params = [];
    } else if (includeArchived) {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      params = [];
    } else {
      queryBase = `
        FROM officials o
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
      ORDER BY ${termId || req.query.only_archived === 'true' ? 'et.year DESC, ' : ''}o.category, o.position 
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

const restoreArchivedOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;

    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Official IDs array is required'
      });
    }

    const contacts = await pool.query(
      `SELECT contact FROM officials WHERE id = ANY($1) AND contact IS NOT NULL AND contact != ''`,
      [officialIds]
    );

    // 2. Check for contact conflicts
    if (contacts.rows.length > 0) {
      const dup = await pool.query(
        `SELECT id FROM officials WHERE contact = ANY($1) AND status = 'active' AND NOT (id = ANY($2))`,
        [contacts.rows.map(c => c.contact), officialIds]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot restore: contact numbers already in use by active officials'
        });
      }
    }

    // 3. New Requirement: Check for position conflicts
    const officialsToRestore = await pool.query(
      `SELECT name, position FROM officials WHERE id = ANY($1) AND position IS NOT NULL AND position != ''`,
      [officialIds]
    );

    if (officialsToRestore.rows.length > 0) {
      const positions = officialsToRestore.rows.map(o => o.position);
      
      // Check for internal conflicts in the restoration set itself
      const seen = new Set();
      for (const o of officialsToRestore.rows) {
        if (seen.has(o.position)) {
          return res.status(409).json({
            success: false,
            message: `Multiple officials in the selection have the same position: ${o.position}`
          });
        }
        seen.add(o.position);
      }

      // Check against active officials
      const dupPos = await pool.query(
        `SELECT name, position FROM officials WHERE position = ANY($1) AND status = 'active' AND NOT (id = ANY($2))`,
        [positions, officialIds]
      );

      if (dupPos.rows.length > 0) {
        const conflict = dupPos.rows[0];
        return res.status(409).json({
          success: false,
          message: `Cannot restore: Position '${conflict.position}' is already occupied by ${conflict.name} in the active list.`
        });
      }
    }

    const result = await pool.query(
      `UPDATE officials SET status = 'active', election_term_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) RETURNING *`,
      [officialIds]
    );

    res.json({
      success: true,
      message: `Successfully restored ${result.rows.length} officials`,
      data: result.rows
    });
  } catch (error) {
    console.error('Error restoring officials:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to restore officials' });
  }
};

// ==================== EXISTING OFFICIALS FUNCTIONS ====================

const getAllOfficials = async (req, res) => {
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
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.election_term_id = $1 OR o.status = 'active' OR o.status IS NULL)
        AND (o.status = 'active' OR o.status IS NULL)`;
      params.push(termId);
      if (termOfService) {
        query += ` AND o.term_of_service = $2`;
        params.push(termOfService);
      }
      query += ` ORDER BY o.category, o.position`;
    } else if (includeArchived) {
      query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      if (termOfService) {
        query += ` WHERE o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ORDER BY o.status, et.year DESC, o.category, o.position`;
    } else {
      query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
      if (termOfService) {
        query += ` AND o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ORDER BY o.category, o.position`;
    }

    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({ error: 'Failed to fetch officials' });
  }
};

const getOfficialById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch official' });
  }
};

const createOfficial = async (req, res) => {
  try {
    const validated = officialSchema.parse(req.body);
    const { name, category, position, contact, term_of_service } = validated;

    const normalizedContact = normalizePhone(contact);
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    if (normalizedContact) {
      const dup = await pool.query(
        "SELECT id FROM officials WHERE contact = $1 AND (status = 'active' OR status IS NULL)",
        [normalizedContact]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use by another official' });
      }
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM officials WHERE category = $1 AND (status = 'active' OR status IS NULL)",
      [category]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= CATEGORY_LIMITS[category]) {
      return res.status(400).json({
        success: false,
        message: `Category ${category} has reached maximum limit of ${CATEGORY_LIMITS[category]} officials`
      });
    }

    // New Requirement: Check for position uniqueness
    if (position && position.trim() !== '') {
      const posDup = await pool.query(
        "SELECT name FROM officials WHERE LOWER(position) = LOWER($1) AND (status = 'active' OR status IS NULL)",
        [position.trim()]
      );
      if (posDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The position '${position}' is already occupied by ${posDup.rows[0].name}`
        });
      }
    }

    let photoUrl = req.file ? formatPhotoUrl(req.file.path) : null;

    const currentTerm = await pool.query("SELECT id FROM election_terms WHERE is_current = TRUE");
    const termId = currentTerm.rows.length > 0 ? currentTerm.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO officials (name, category, position, contact, photo, election_term_id, status, term_of_service) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7) RETURNING *`,
      [name, category, position || null, normalizedContact || null, photoUrl, termId, term_of_service || null]
    );

    await syncCurrentTerm(term_of_service);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error creating official:', error);
    if (error && error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Contact already in use' });
    }
    res.status(500).json({ success: false, message: 'Failed to create official' });
  }
};

const updateOfficial = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = officialSchema.partial().parse(req.body);
    const { name, category, position, contact, term_of_service } = validated;

    const existing = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const normalizedContact = contact ? normalizePhone(contact) : null;
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    if (normalizedContact) {
      const dup = await pool.query(
        "SELECT id FROM officials WHERE contact = $1 AND id != $2 AND (status = 'active' OR status IS NULL)",
        [normalizedContact, id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use' });
      }
    }

    // New Requirement: Check for position uniqueness (if changed or newly provided)
    if (position && position.trim() !== '') {
      const posDup = await pool.query(
        "SELECT name FROM officials WHERE LOWER(position) = LOWER($1) AND id != $2 AND (status = 'active' OR status IS NULL)",
        [position.trim(), id]
      );
      if (posDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The position '${position}' is already occupied by ${posDup.rows[0].name}`
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
      `UPDATE officials SET name = COALESCE($1, name), category = COALESCE($2, category),
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
    console.error('Error updating official:', error);
    res.status(500).json({ success: false, message: 'Failed to update official' });
  }
};

const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const official = result.rows[0];

    if (official.photo) {
      const filePath = official.photo.replace(/^\//, './');
      deleteFile(filePath);
    }

    await pool.query('DELETE FROM officials WHERE id = $1', [id]);
    res.json({ success: true, message: 'Official deleted successfully' });
  } catch (error) {
    console.error('Error deleting official:', error);
    res.status(500).json({ success: false, message: 'Failed to delete official' });
  }
};

const exportOfficials = async (req, res) => {
  try {
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, et.name as term_name, et.year as term_year
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
    let params = [];
    if (termOfService) {
      query += ` AND o.term_of_service = $1`;
      params.push(termOfService);
    }
    query += ` ORDER BY o.category, o.position`;

    const result = await pool.query(query, params);

    const formatPhoneForExcel = (phone) => {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
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

    XLSX.utils.book_append_sheet(wb, ws, 'Officials');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="officials.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting officials:', error);
    res.status(500).json({ success: false, message: 'Failed to export officials' });
  }
};

const exportArchivedOfficials = async (req, res) => {
  try {
    const { termId } = req.params;
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, o.status, et.name as term_name, et.year as term_year, o.term_of_service
        FROM officials o
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
    query += ` ORDER BY o.category, o.position`;

    const result = await pool.query(query, params);

    const formatPhoneForExcel = (phone) => {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
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

    XLSX.utils.book_append_sheet(wb, ws, 'Archived Officials');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="archived_officials.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting archived officials:', error);
    res.status(500).json({ success: false, message: 'Failed to export archived officials' });
  }
};

const deleteArchivedOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;

    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [officialId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const official = result.rows[0];

    if (official.photo) {
      const filePath = official.photo.replace(/^\//, './');
      deleteFile(filePath);
    }

    await pool.query('DELETE FROM officials WHERE id = $1', [officialId]);
    res.json({ success: true, message: 'Archived official deleted successfully' });
  } catch (error) {
    console.error('Error deleting archived official:', error);
    res.status(500).json({ success: false, message: 'Failed to delete archived official' });
  }
};

const bulkDeleteArchivedOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;
    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Official IDs are required' });
    }

    await pool.query('DELETE FROM officials WHERE id = ANY($1)', [officialIds]);
    res.json({ success: true, message: `Successfully deleted ${officialIds.length} archived officials` });
  } catch (error) {
    console.error('Error bulk deleting archived officials:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk delete' });
  }
};

module.exports = {
  getAllOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  exportOfficials,
  exportArchivedOfficials,
  deleteArchivedOfficial,
  bulkDeleteArchivedOfficials,
  CATEGORY_LIMITS,
  VALID_CATEGORIES,
  getAllElectionTerms,
  getCurrentElectionTerm,
  createElectionTerm,
  updateElectionTerm,
  deleteElectionTerm,
  archiveCurrentOfficials,
  getOfficialsByTerm,
  restoreArchivedOfficials
};
