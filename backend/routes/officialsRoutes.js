const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const officialsController = require('../controllers/officialsController');

// IMPORTANT: Specific routes must come BEFORE /:id route

// Archive and history routes - DELETE route MUST come BEFORE GET routes with :param to avoid conflicts
router.delete('/history/:officialId', officialsController.deleteArchivedOfficial);
router.delete('/history', officialsController.bulkDeleteArchivedOfficials);
router.get('/history', officialsController.getOfficialsByTerm);
router.get('/history/export', officialsController.exportArchivedOfficials);
router.get('/history/:termId', officialsController.getOfficialsByTerm);
router.get('/history/:termId/export', officialsController.exportArchivedOfficials);

router.post('/archive', officialsController.archiveCurrentOfficials);
router.post('/restore', officialsController.restoreArchivedOfficials);

// Election term management routes (must come before /:id)
router.get('/terms', officialsController.getAllElectionTerms);
router.get('/terms/current', officialsController.getCurrentElectionTerm);
router.post('/terms', officialsController.createElectionTerm);
router.put('/terms/:id', officialsController.updateElectionTerm);
router.delete('/terms/:id', officialsController.deleteElectionTerm);

// Existing officials routes
router.get('/', officialsController.getAllOfficials);
router.get('/export', officialsController.exportOfficials);
router.get('/:id', officialsController.getOfficialById);
router.post('/', upload.single('photo'), officialsController.createOfficial);
router.put('/:id', upload.single('photo'), officialsController.updateOfficial);
router.delete('/:id', officialsController.deleteOfficial);

module.exports = router;
