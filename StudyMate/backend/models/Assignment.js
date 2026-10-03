// models/Assignment.js — Task/assignment schema with Kanban status and priority
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
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
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Priority levels map to UI color schemes: chill=green, important=amber, urgent=red
    priority: {
      type: String,
      enum: ['chill', 'important', 'urgent'],
      default: 'chill',
    },
    // Kanban column status
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo',
    },
    // Grade weightage percentage (e.g., 20 means 20% of final grade)
    weightage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
assignmentSchema.index({ user: 1, status: 1 }); // Kanban board queries
assignmentSchema.index({ user: 1, dueDate: 1 }); // Upcoming deadline queries

// ─── Virtual: is this task overdue? ──────────────────────────────────────────
assignmentSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > new Date(this.dueDate);
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
