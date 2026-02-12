const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial
} = require('../controllers/officialsController');

// GET all officials
router.get('/', getAllOfficials);

// GET single official by ID
router.get('/:id', getOfficialById);

// POST create new official with photo upload
router.post('/', upload.single('photo'), createOfficial);

// PUT update official with optional photo upload
router.put('/:id', upload.single('photo'), updateOfficial);

// DELETE official
router.delete('/:id', deleteOfficial);

module.exports = router;
