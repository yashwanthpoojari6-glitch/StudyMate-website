// models/Note.js — Rich note schema with Markdown content and AI/share features
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // Full Markdown content — stored as plain string, rendered on frontend
    content: {
      type: String,
      default: '',
    },
    emoji: {
      type: String,
      default: '📝',
    },
    tags: {
      type: [String],
      default: [],
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    // Unique slug used for public read-only URL: /note/public/:shareToken
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Sparse index allows multiple null values
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
noteSchema.index({ user: 1, updatedAt: -1 }); // Sort by most recently updated
noteSchema.index({ shareToken: 1 }, { sparse: true });
noteSchema.index({ tags: 1 }); // Efficient tag filtering

// ─── Instance Method: generate or regenerate share token ──────────────────────
noteSchema.methods.enableSharing = function () {
  if (!this.shareToken) {
    this.shareToken = nanoid(12); // Short, URL-safe unique ID
  }
  this.isShared = true;
};

noteSchema.methods.disableSharing = function () {
  this.isShared = false;
  // Keep the token so the old link just stops working — can re-enable later
};

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
