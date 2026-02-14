require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { checkPlatformActive } = require('./middleware/platformStatus');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
// For protected routes: authenticate first, THEN check platform status
app.use('/api/evaluations', authenticateToken, checkPlatformActive, require('./routes/evaluations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/platform', authenticateToken, checkPlatformActive, require('./routes/platform'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/user', require('./routes/user'));
app.use('/api/student', authenticateToken, require('./routes/feedback'));
app.use('/api/professor', require('./routes/professorRoutes'));

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  const { closeDatabase } = require('./config/database');
  closeDatabase();
  process.exit(0);
});

module.exports = app;
