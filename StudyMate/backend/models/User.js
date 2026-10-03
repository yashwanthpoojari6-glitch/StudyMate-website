// models/User.js — Core user schema with streak tracking and study stats
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    avatar: {
      type: String, // URL to avatar image or initials fallback
      default: '',
    },
    // Study streak — tracks consecutive daily activity
    streak: {
      count: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    // Aggregate study statistics for the dashboard
    studyStats: {
      totalFocusMinutes: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
    },
    // User preferences
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      pomodoroWork: { type: Number, default: 25 },
      pomodoroBreak: { type: Number, default: 5 },
      soundscape: { type: String, default: 'none' },
    },
  },
  { timestamps: true }
);

// ─── Instance Methods ─────────────────────────────────────────────────────────

// Compare entered password with stored hash during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update streak based on last active date
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.streak.lastActiveDate) {
    this.streak.count = 1;
    this.streak.lastActiveDate = today;
    return;
  }

  const lastActive = new Date(this.streak.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return; // Already active today
  if (diffDays === 1) {
    this.streak.count += 1; // Consecutive day — increment streak
  } else {
    this.streak.count = 1; // Streak broken — reset to 1
  }
  this.streak.lastActiveDate = today;
};

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

// Hash password before saving — only runs when password field is modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }); // Fast lookup by email during auth

const User = mongoose.model('User', userSchema);
module.exports = User;
