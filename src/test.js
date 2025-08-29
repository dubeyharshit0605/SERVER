// Test script to verify the API structure and functionality
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

console.log('Starting API verification tests...');

// Test JWT functionality
console.log('\n--- Testing JWT functionality ---');
try {
  const testSecret = 'test_secret_key';
  const testPayload = { id: 'test-user-id' };
  
  // Generate a test token
  const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
  console.log('✅ JWT token generation successful:', token.substring(0, 20) + '...');
  
  // Verify the token
  const decoded = jwt.verify(token, testSecret);
  console.log('✅ JWT token verification successful:', decoded);
} catch (error) {
  console.error('❌ JWT test failed:', error.message);
}

// Test bcrypt functionality
console.log('\n--- Testing bcrypt functionality ---');
try {
  const testPassword = 'password123';
  
  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(testPassword, salt);
  console.log('✅ Password hashing successful:', hashedPassword);
  
  // Compare password
  const isMatch = bcrypt.compareSync(testPassword, hashedPassword);
  console.log('✅ Password comparison successful:', isMatch);
} catch (error) {
  console.error('❌ bcrypt test failed:', error.message);
}

// Test mongoose schema definitions
console.log('\n--- Testing mongoose schema definitions ---');
try {
  // Import models
  const User = require('./models/user.model');
  const Tree = require('./models/tree.model');
  const Reward = require('./models/reward.model');
  
  console.log('✅ User model schema paths:', Object.keys(User.schema.paths));
  console.log('✅ Tree model schema paths:', Object.keys(Tree.schema.paths));
  console.log('✅ Reward model schema paths:', Object.keys(Reward.schema.paths));
  
  // Test User model methods
  console.log('✅ User model methods:', Object.keys(User.schema.methods));
  
  // Test Tree model indexes
  console.log('✅ Tree model indexes:', Tree.schema.indexes());
} catch (error) {
  console.error('❌ Mongoose schema test failed:', error.message);
}

// Test route files
console.log('\n--- Testing route files ---');
try {
  // Import routes
  const authRoutes = require('./routes/auth.routes');
  const treeRoutes = require('./routes/tree.routes');
  const rewardRoutes = require('./routes/reward.routes');
  const syncRoutes = require('./routes/sync.routes');
  
  console.log('✅ Auth routes loaded successfully');
  console.log('✅ Tree routes loaded successfully');
  console.log('✅ Reward routes loaded successfully');
  console.log('✅ Sync routes loaded successfully');
} catch (error) {
  console.error('❌ Route files test failed:', error.message);
}

// Test controller files
console.log('\n--- Testing controller files ---');
try {
  // Import controllers
  const authController = require('./controllers/auth.controller');
  const treeController = require('./controllers/tree.controller');
  const rewardController = require('./controllers/reward.controller');
  const syncController = require('./controllers/sync.controller');
  
  console.log('✅ Auth controller functions:', Object.keys(authController));
  console.log('✅ Tree controller functions:', Object.keys(treeController));
  console.log('✅ Reward controller functions:', Object.keys(rewardController));
  console.log('✅ Sync controller functions:', Object.keys(syncController));
} catch (error) {
  console.error('❌ Controller files test failed:', error.message);
}

// Test middleware
console.log('\n--- Testing middleware ---');
try {
  // Import middleware
  const authMiddleware = require('./middleware/auth.middleware');
  
  console.log('✅ Auth middleware functions:', Object.keys(authMiddleware));
} catch (error) {
  console.error('❌ Middleware test failed:', error.message);
}

console.log('\nAPI verification tests completed!');

