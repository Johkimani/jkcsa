const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const jumuiyaOfficialsController = require('../controllers/jumuiyaOfficialsController');

// Archive & Restore routes
router.post('/archive', jumuiyaOfficialsController.archiveCurrentJumuiyaOfficials);
router.post('/restore', jumuiyaOfficialsController.restoreArchivedJumuiyaOfficials);
router.get('/term/:termId', jumuiyaOfficialsController.getJumuiyaOfficialsByTerm);
router.get('/term/:termId/export', jumuiyaOfficialsController.exportArchivedJumuiyaOfficials);
router.delete('/term', jumuiyaOfficialsController.bulkDeleteArchivedJumuiyaOfficials);
router.delete('/term/:id', jumuiyaOfficialsController.deleteArchivedJumuiyaOfficial);

// Basic CRUD routes for Jumuiya Officials
router.get('/', jumuiyaOfficialsController.getAllJumuiyaOfficials);
router.get('/export', jumuiyaOfficialsController.exportJumuiyaOfficials);
router.get('/:id', jumuiyaOfficialsController.getJumuiyaOfficialById);
router.post('/', upload.single('photo'), jumuiyaOfficialsController.createJumuiyaOfficial);
router.put('/:id', upload.single('photo'), jumuiyaOfficialsController.updateJumuiyaOfficial);
router.delete('/:id', jumuiyaOfficialsController.deleteJumuiyaOfficial);

module.exports = router;
