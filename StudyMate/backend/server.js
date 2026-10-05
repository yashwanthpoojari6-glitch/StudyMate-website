// server.js — Express application entry point
// Wires together middleware, routes, DB connection, and error handling

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports — each module encapsulates a feature domain
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');
const assignmentRoutes = require('./routes/assignments');
const focusRoutes = require('./routes/focus');
const aiRoutes = require('./routes/ai');

const app = express();

// Connect to MongoDB before starting the server
connectDB();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: ['https://study-mate-brown-xi.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for large note content
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (development only) ───────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint — useful for deployment platforms
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler (must be last middleware) ───────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 StudyMate API running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
