// routes/assignments.js
const express = require('express');
const router = express.Router();
const { getAssignments, createAssignment, updateAssignment, updateStatus, deleteAssignment } = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getAssignments).post(createAssignment);
router.route('/:id').put(updateAssignment).delete(deleteAssignment);
router.patch('/:id/status', updateStatus);

module.exports = router;
