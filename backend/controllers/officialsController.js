const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const CATEGORY_LIMITS = {
  'Executive': 6,
  'Jumuia': 2,
  'Bible': 2,
  'Rosary': 2,
  'Pamphlet': 2,
  'Project': 2,
  'Liturgist': 2,
  'Choir': 2,
  'Catechist': 1
};

const VALID_CATEGORIES = Object.keys(CATEGORY_LIMITS);

// Helper function to validate phone number
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.trim());
};

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to format photo URL
const formatPhotoUrl = (filePath) => {
  if (filePath) {
    return filePath.replace(/\\/g, '/').replace('./', '/');
  }
  return null;
};

// const getAllOfficials = async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM officials ORDER BY category, created_at DESC');
//     console.log(result);
    
//     res.json({
//       success: true,
//       data: result.rows
//     });
    
//   } catch (error) {
//     console.error('Error fetching officials:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch officials'
//     });
//   }
// };
const getAllOfficials = async (req, res) => {
  try {
    const query = `
      SELECT id, name, category, photo, position, contact, created_at 
      FROM officials 
      ORDER BY category, position
    `;
    const result = await pool.query(query);
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
      return res.status(404).json({
        success: false,
        message: 'Official not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch official'
    });
  }
};

const createOfficial = async (req, res) => {
  try {
    const { name, category, position, contact } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Validate phone if provided
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Check category limits
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM officials WHERE category = $1',
      [category]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= CATEGORY_LIMITS[category]) {
      return res.status(400).json({
        success: false,
        message: `Category ${category} has reached maximum limit of ${CATEGORY_LIMITS[category]} officials`
      });
    }

    // Get photo path
    let photoUrl = null;
    if (req.file) {
      photoUrl = formatPhotoUrl(req.file.path);
    }

    // Insert into database
    const result = await pool.query(
      `INSERT INTO officials (name, category, position, contact, photo) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, category, position || null, contact || null, photoUrl]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating official:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create official'
    });
  }
};

const updateOfficial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, position, contact } = req.body;

    // Check if official exists
    const existingResult = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Official not found'
      });
    }

    const existingOfficial = existingResult.rows[0];

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Validate phone if provided
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check category limits if category is being changed
    if (category && category !== existingOfficial.category) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM officials WHERE category = $1',
        [category]
      );
      const currentCount = parseInt(countResult.rows[0].count);

      if (currentCount >= CATEGORY_LIMITS[category]) {
        return res.status(400).json({
          success: false,
          message: `Category ${category} has reached maximum limit of ${CATEGORY_LIMITS[category]} officials`
        });
      }
    }

    // Handle photo update
    let photoUrl = existingOfficial.photo;
    if (req.file) {
      // Delete old photo if exists
      if (existingOfficial.photo) {
        const oldFilePath = existingOfficial.photo.replace(/^\//, './');
        deleteFile(oldFilePath);
      }
      photoUrl = formatPhotoUrl(req.file.path);
    }

    // Update database
    const result = await pool.query(
      `UPDATE officials 
       SET name = COALESCE($1, name), 
           category = COALESCE($2, category), 
           position = COALESCE($3, position), 
           contact = COALESCE($4, contact),
           photo = COALESCE($5, photo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, category, position, contact || null, photoUrl, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating official:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update official'
    });
  }
};

const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if official exists
    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Official not found'
      });
    }

    const official = result.rows[0];

    // Delete photo file if exists
    if (official.photo) {
      const filePath = official.photo.replace(/^\//, './');
      deleteFile(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM officials WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Official deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting official:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete official'
    });
  }
};

module.exports = {
  getAllOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  CATEGORY_LIMITS,
  VALID_CATEGORIES
};
