// models/FocusSession.js — Pomodoro session tracker for heatmap and stats
const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [1, 'Session must be at least 1 minute'],
    },
    // The date this session was completed — stored as date-only for heatmap grouping
    completedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional: which subject this focus session was for
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    sessionType: {
      type: String,
      enum: ['pomodoro', 'freeflow'],
      default: 'pomodoro',
    },
  },
  { timestamps: false } // completedAt covers this
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index for heatmap queries: "give me all sessions for user X in year Y"
focusSessionSchema.index({ user: 1, completedAt: -1 });

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
module.exports = FocusSession;
