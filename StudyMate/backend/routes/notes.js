// routes/notes.js
const express = require('express');
const router = express.Router();
const { getNotes, getNote, getPublicNote, createNote, updateNote, toggleShare, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// Public route — no auth required for shared notes
router.get('/public/:shareToken', getPublicNote);

// All other routes are protected
router.use(protect);
router.route('/').get(getNotes).post(createNote);
router.route('/:id').get(getNote).put(updateNote).delete(deleteNote);
router.patch('/:id/share', toggleShare);

module.exports = router;
