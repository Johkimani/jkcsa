const fs = require('fs');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const pool = require('../config/db');

/**
 * Normalizes a phone number to E.164 format.
 * Defaults to Kenya (KE) if no country code is provided.
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  const s = String(phone).trim();
  let pn = parsePhoneNumberFromString(s);
  if (!pn) pn = parsePhoneNumberFromString(s, 'KE');
  if (!pn || !pn.isValid()) return null;
  return pn.number;
};

/**
 * Validates a phone number.
 */
const isValidPhone = (phone) => {
  if (!phone) return true;
  const pn = parsePhoneNumberFromString(String(phone));
  if (pn) return pn.isValid();
  const pn2 = parsePhoneNumberFromString(String(phone), 'KE');
  return pn2 ? pn2.isValid() : false;
};

/**
 * Deletes a file from the filesystem safely.
 */
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Formats a filesystem path into a browser-friendly URL.
 */
const formatPhotoUrl = (filePath) => {
  if (filePath) {
    return filePath.replace(/\\/g, '/').replace('./', '/');
  }
  return null;
};

/**
 * Synchronizes the global "Active Term" in the DB based on the most recently added official's term.
 * This ensures the dashboard always displays the currently relevant term of service.
 */
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

/**
 * Formats a phone number for Excel export (ensuring consistent e.g. 07... format).
 */
const formatPhoneForExcel = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 9) {
    return '0' + digits.slice(-9);
  }
  return phone;
};

module.exports = {
  normalizePhone,
  isValidPhone,
  deleteFile,
  formatPhotoUrl,
  syncCurrentTerm,
  formatPhoneForExcel
};
