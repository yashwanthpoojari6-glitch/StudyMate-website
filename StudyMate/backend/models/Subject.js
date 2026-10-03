// models/Subject.js — Subject/course schema with chapter progress tracking
const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isCompleted: { type: Boolean, default: false },
}, { _id: true });

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for fast user-based queries
    },
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
    },
    // Tailwind color class or hex code for visual differentiation on the UI
    colorTag: {
      type: String,
      default: '#6366F1',
    },
    examDate: {
      type: Date,
      default: null,
    },
    chapters: [chapterSchema],
    // Computed field: percentage of completed chapters (virtual)
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ─── Virtual: syllabus progress percentage ────────────────────────────────────
subjectSchema.virtual('progress').get(function () {
  if (!this.chapters || this.chapters.length === 0) return 0;
  const completed = this.chapters.filter((c) => c.isCompleted).length;
  return Math.round((completed / this.chapters.length) * 100);
});

// ─── Virtual: days until exam ─────────────────────────────────────────────────
subjectSchema.virtual('daysUntilExam').get(function () {
  if (!this.examDate) return null;
  const diff = new Date(this.examDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
