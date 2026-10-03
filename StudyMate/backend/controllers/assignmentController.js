// controllers/assignmentController.js — Kanban task board CRUD
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res, next) => {
  try {
    const { status, priority, subject } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = subject;

    const assignments = await Assignment.find(filter)
      .populate('subject', 'title colorTag code')
      .sort({ dueDate: 1, createdAt: -1 }); // Soonest due first

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/assignments
// @access  Private
const createAssignment = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, subject, weightage } = req.body;
    const assignment = await Assignment.create({
      user: req.user._id,
      title,
      description,
      dueDate,
      priority: priority || 'chill',
      subject: subject || null,
      weightage: weightage || 0,
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/assignments/:id
// @access  Private
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'title colorTag');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // When a task is completed, increment the user's completedTasks stat
    if (req.body.status === 'completed') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'studyStats.completedTasks': 1 },
      });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/assignments/:id/status
// @access  Private — quick Kanban drag-and-drop status update
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (status === 'completed') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'studyStats.completedTasks': 1 },
      });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/assignments/:id
// @access  Private
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAssignments, createAssignment, updateAssignment, updateStatus, deleteAssignment };
