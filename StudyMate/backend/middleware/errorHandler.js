// middleware/errorHandler.js — Centralized error handling middleware
// All errors thrown with `next(error)` or unhandled async errors land here.
// This prevents duplicate error-handling logic across controllers.

const errorHandler = (err, req, res, next) => {
  // Log the full stack trace in development for easier debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err.stack);
  }

  // Default to 500 if no status code was set
  let statusCode = err.statusCode || res.statusCode === 200 ? err.statusCode || 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Collect all field-level validation messages into one readable string
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // ── Mongoose Duplicate Key Error (e.g., email already exists) ─────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // ── Mongoose CastError (invalid ObjectId format) ──────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
