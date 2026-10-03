// controllers/subjectController.js — CRUD for subjects with chapter management
const Subject = require('../models/Subject');

// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res, next) => {
  try {
    const { title, code, colorTag, examDate, chapters } = req.body;
    const subject = await Subject.create({
      user: req.user._id,
      title,
      code,
      colorTag,
      examDate,
      chapters: chapters || [],
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/subjects/:id/chapters/:chapterId
// @access  Private — toggle a single chapter's completion status
const toggleChapter = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    chapter.isCompleted = !chapter.isCompleted;
    await subject.save();

    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, toggleChapter, deleteSubject };
