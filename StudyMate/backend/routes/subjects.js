// routes/subjects.js
const express = require('express');
const router = express.Router();
const { getSubjects, getSubject, createSubject, updateSubject, toggleChapter, deleteSubject } = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All subject routes require authentication

router.route('/').get(getSubjects).post(createSubject);
router.route('/:id').get(getSubject).put(updateSubject).delete(deleteSubject);
router.patch('/:id/chapters/:chapterId', toggleChapter);

module.exports = router;
