const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const treeRoutes = require('./routes/tree.routes');
const rewardRoutes = require('./routes/reward.routes');
const syncRoutes = require('./routes/sync.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet()); // Set security HTTP headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api/', limiter); // Apply rate limiting to API routes

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(morgan('dev'));

// Request body sanitization
app.use((req, res, next) => {
  // Sanitize request body to prevent NoSQL injection
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic sanitization - remove $ and . operators from strings
        req.body[key] = req.body[key].replace(/\$/g, '').replace(/\./g, '');
      }
    });
  }
  next();
});

// Connect to MongoDB using the improved connection handler
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/sync', syncRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Mangrove Tracker API',
    status: 'Service is running correctly',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error(`Server error: ${error.message}`);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the server, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Gracefully shutdown
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
  
  // If server doesn't close in 1 second, force shutdown
  setTimeout(() => {
    console.error('Forcing shutdown after uncaught exception');
    process.exit(1);
  }, 1000);
});

module.exports = { app, server };
