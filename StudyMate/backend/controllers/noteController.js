// controllers/noteController.js — Note CRUD with sharing and public preview
const Note = require('../models/Note');

// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const { subject, tag, search } = req.query;
    const filter = { user: req.user._id };

    if (subject) filter.subject = subject;
    if (tag) filter.tags = tag;
    if (search) {
      // Text search on title — for full text search, a $text index would be needed
      filter.title = { $regex: search, $options: 'i' };
    }

    const notes = await Note.find(filter)
      .populate('subject', 'title colorTag code')
      .sort({ isPinned: -1, updatedAt: -1 }); // Pinned notes first, then by recency

    res.json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/notes/:id
// @access  Private
const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id }).populate(
      'subject', 'title colorTag'
    );
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/notes/public/:shareToken
// @access  Public — read-only shared note view
const getPublicNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      shareToken: req.params.shareToken,
      isShared: true,
    }).populate('subject', 'title');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or sharing disabled' });
    }

    // Return only safe public fields — never expose user ObjectId
    res.json({
      success: true,
      data: {
        title: note.title,
        content: note.content,
        emoji: note.emoji,
        tags: note.tags,
        subject: note.subject,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const { title, content, emoji, subject, tags } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      emoji,
      subject: subject || null,
      tags: tags || [],
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/notes/:id/share
// @access  Private — toggle sharing and return the share token
const toggleShare = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (note.isShared) {
      note.disableSharing();
    } else {
      note.enableSharing();
    }

    await note.save();

    res.json({
      success: true,
      data: {
        isShared: note.isShared,
        shareToken: note.shareToken,
        shareUrl: note.isShared ? `/note/public/${note.shareToken}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotes, getNote, getPublicNote, createNote, updateNote, toggleShare, deleteNote };
