const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Mangrove Tracker API',
    status: 'Service is running correctly'
  });
});

// Test routes to verify API structure
app.get('/api/test/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are configured correctly',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register a new user' },
      { method: 'POST', path: '/api/auth/login', description: 'Login and get JWT token' },
      { method: 'GET', path: '/api/auth/profile', description: 'Get user profile (protected)' },
      { method: 'PUT', path: '/api/auth/profile', description: 'Update user profile (protected)' }
    ]
  });
});

app.get('/api/test/trees', (req, res) => {
  res.json({
    success: true,
    message: 'Tree routes are configured correctly',
    endpoints: [
      { method: 'POST', path: '/api/trees', description: 'Create a new tree record (protected)' },
      { method: 'GET', path: '/api/trees', description: 'Get all trees for a community (protected)' },
      { method: 'GET', path: '/api/trees/:id', description: 'Get a single tree by ID (protected)' },
      { method: 'PUT', path: '/api/trees/:id', description: 'Update a tree record (protected)' },
      { method: 'DELETE', path: '/api/trees/:id', description: 'Delete a tree record (protected)' },
      { method: 'POST', path: '/api/trees/:id/maintenance', description: 'Add maintenance record to a tree (protected)' },
      { method: 'PUT', path: '/api/trees/:id/verify', description: 'Verify a tree record (leaders only)' }
    ]
  });
});

app.get('/api/test/rewards', (req, res) => {
  res.json({
    success: true,
    message: 'Reward routes are configured correctly',
    endpoints: [
      { method: 'GET', path: '/api/rewards', description: 'Get rewards for the current user (protected)' },
      { method: 'GET', path: '/api/rewards/community', description: 'Get rewards for a community (leaders only)' },
      { method: 'POST', path: '/api/rewards', description: 'Award points to a user (leaders only)' },
      { method: 'GET', path: '/api/rewards/leaderboard', description: 'Get leaderboard for a community (protected)' }
    ]
  });
});

app.get('/api/test/sync', (req, res) => {
  res.json({
    success: true,
    message: 'Sync routes are configured correctly',
    endpoints: [
      { method: 'POST', path: '/api/sync/trees', description: 'Sync offline tree data (protected)' },
      { method: 'POST', path: '/api/sync/maintenance', description: 'Sync offline maintenance records (protected)' },
      { method: 'GET', path: '/api/sync/data', description: 'Get all data for offline use (protected)' }
    ]
  });
});

// Test JWT functionality
app.get('/api/test/jwt', (req, res) => {
  const jwt = require('jsonwebtoken');
  const testSecret = 'test_secret_key';
  const testPayload = { id: 'test-user-id' };
  
  try {
    // Generate a test token
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    
    // Verify the token
    const decoded = jwt.verify(token, testSecret);
    
    res.json({
      success: true,
      message: 'JWT functionality is working correctly',
      testToken: token,
      decoded: decoded
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'JWT functionality test failed',
      error: error.message
    });
  }
});

// Test MongoDB models structure
app.get('/api/test/models', (req, res) => {
  // Import models
  const User = require('./models/user.model');
  const Tree = require('./models/tree.model');
  const Reward = require('./models/reward.model');
  
  res.json({
    success: true,
    message: 'Models are structured correctly',
    models: {
      User: {
        schema: Object.keys(User.schema.paths),
        methods: Object.keys(User.schema.methods)
      },
      Tree: {
        schema: Object.keys(Tree.schema.paths),
        indexes: Tree.schema.indexes()
      },
      Reward: {
        schema: Object.keys(Reward.schema.paths)
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

module.exports = app;

