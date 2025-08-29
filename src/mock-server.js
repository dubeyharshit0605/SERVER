const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mock JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'mock_jwt_secret';

// Mock database
const mockDB = {
  users: [
    {
      _id: '60d0fe4f5311236168a109ca',
      nickname: 'testuser',
      communityId: 'community1',
      password: '$2a$10$XQHXVJfQOMQSKLmiaVEx5OiCLBAivs8Jx0xJeCEkSHjGwkspJHYE6', // 'password123'
      role: 'member',
      rewardPoints: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '60d0fe4f5311236168a109cb',
      nickname: 'communityleader',
      communityId: 'community1',
      password: '$2a$10$XQHXVJfQOMQSKLmiaVEx5OiCLBAivs8Jx0xJeCEkSHjGwkspJHYE6', // 'password123'
      role: 'leader',
      rewardPoints: 100,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  trees: [
    {
      _id: '60d0fe4f5311236168a109cc',
      userId: '60d0fe4f5311236168a109ca',
      communityId: 'community1',
      location: {
        type: 'Point',
        coordinates: [73.123, 19.456]
      },
      species: 'Rhizophora mucronata',
      plantedDate: new Date('2023-05-15'),
      healthStatus: 'healthy',
      maintenanceRecords: [
        {
          date: new Date('2023-06-01'),
          activity: 'Watering',
          notes: 'Regular maintenance',
          healthStatus: 'healthy'
        }
      ],
      verificationStatus: 'pending',
      images: ['https://example.com/image1.jpg'],
      notes: 'Planted near the coastal area',
      createdAt: new Date('2023-05-15'),
      updatedAt: new Date('2023-06-01')
    }
  ],
  rewards: [
    {
      _id: '60d0fe4f5311236168a109cd',
      userId: '60d0fe4f5311236168a109ca',
      communityId: 'community1',
      points: 10,
      reason: 'tree-planting',
      description: 'Planted a new mangrove tree',
      relatedTreeId: '60d0fe4f5311236168a109cc',
      createdAt: new Date('2023-05-15'),
      updatedAt: new Date('2023-05-15')
    }
  ]
};

// Mock authentication middleware
const mockProtect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find user in mock database
      const user = mockDB.users.find(u => u._id === decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Add user to request object (exclude password)
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Mock community leader middleware
const mockIsCommunityLeader = (req, res, next) => {
  if (req.user && req.user.role === 'leader') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as a community leader'
    });
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Mangrove Tracker API (Mock Server)',
    status: 'Service is running correctly'
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { nickname, communityId, password, role } = req.body;
    
    // Check if required fields are provided
    if (!nickname || !communityId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide nickname, communityId, and password'
      });
    }
    
    // Check if user already exists
    const userExists = mockDB.users.find(u => u.nickname === nickname);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this nickname already exists'
      });
    }
    
    // Create new user (mock)
    const newUser = {
      _id: `mock-${Date.now()}`,
      nickname,
      communityId,
      password: 'hashed_password', // In a real app, this would be hashed
      role: role || 'member',
      rewardPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to mock database
    mockDB.users.push(newUser);
    
    // Generate token
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        nickname: newUser.nickname,
        communityId: newUser.communityId,
        role: newUser.role,
        rewardPoints: newUser.rewardPoints,
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { nickname, password } = req.body;
    
    // Check if required fields are provided
    if (!nickname || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide nickname and password'
      });
    }
    
    // Find user in mock database
    const user = mockDB.users.find(u => u.nickname === nickname);
    
    // For mock server, we'll accept any password for existing users
    if (user) {
      // Generate token
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
      
      res.json({
        success: true,
        user: {
          _id: user._id,
          nickname: user.nickname,
          communityId: user.communityId,
          role: user.role,
          rewardPoints: user.rewardPoints,
          token
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid nickname or password'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/auth/profile', mockProtect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

app.put('/api/auth/profile', mockProtect, (req, res) => {
  try {
    const { nickname, communityId } = req.body;
    
    // Find user in mock database
    const userIndex = mockDB.users.findIndex(u => u._id === req.user._id);
    
    if (userIndex !== -1) {
      // Update user
      if (nickname) mockDB.users[userIndex].nickname = nickname;
      if (communityId) mockDB.users[userIndex].communityId = communityId;
      mockDB.users[userIndex].updatedAt = new Date();
      
      const updatedUser = mockDB.users[userIndex];
      
      // Generate token
      const token = jwt.sign({ id: updatedUser._id }, JWT_SECRET, { expiresIn: '30d' });
      
      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          nickname: updatedUser.nickname,
          communityId: updatedUser.communityId,
          role: updatedUser.role,
          rewardPoints: updatedUser.rewardPoints,
          token
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Tree routes
app.get('/api/trees', mockProtect, (req, res) => {
  try {
    // Filter trees by community ID
    const communityTrees = mockDB.trees.filter(t => t.communityId === req.user.communityId);
    
    res.json({
      success: true,
      count: communityTrees.length,
      trees: communityTrees
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.post('/api/trees', mockProtect, (req, res) => {
  try {
    const { location, species, plantedDate, healthStatus, images, notes, localId } = req.body;
    
    // Check if required fields are provided
    if (!location || !species || !plantedDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location, species, and plantedDate'
      });
    }
    
    // Create new tree
    const newTree = {
      _id: `mock-tree-${Date.now()}`,
      userId: req.user._id,
      communityId: req.user.communityId,
      location,
      species,
      plantedDate: new Date(plantedDate),
      healthStatus: healthStatus || 'healthy',
      maintenanceRecords: [],
      verificationStatus: 'pending',
      images: images || [],
      notes: notes || '',
      localId: localId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to mock database
    mockDB.trees.push(newTree);
    
    // Add reward points for planting a tree
    const newReward = {
      _id: `mock-reward-${Date.now()}`,
      userId: req.user._id,
      communityId: req.user.communityId,
      points: 10,
      reason: 'tree-planting',
      description: 'Planted a new mangrove tree',
      relatedTreeId: newTree._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockDB.rewards.push(newReward);
    
    // Update user's reward points
    const userIndex = mockDB.users.findIndex(u => u._id === req.user._id);
    if (userIndex !== -1) {
      mockDB.users[userIndex].rewardPoints += 10;
    }
    
    res.status(201).json({
      success: true,
      tree: newTree,
      reward: newReward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/trees/:id', mockProtect, (req, res) => {
  try {
    const tree = mockDB.trees.find(t => t._id === req.params.id);
    
    if (tree) {
      res.json({
        success: true,
        tree
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Reward routes
app.get('/api/rewards', mockProtect, (req, res) => {
  try {
    // Filter rewards by user ID
    const userRewards = mockDB.rewards.filter(r => r.userId === req.user._id);
    
    res.json({
      success: true,
      count: userRewards.length,
      totalPoints: userRewards.reduce((sum, reward) => sum + reward.points, 0),
      rewards: userRewards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/rewards/community', mockProtect, mockIsCommunityLeader, (req, res) => {
  try {
    // Filter rewards by community ID
    const communityRewards = mockDB.rewards.filter(r => r.communityId === req.user.communityId);
    
    res.json({
      success: true,
      count: communityRewards.length,
      totalPoints: communityRewards.reduce((sum, reward) => sum + reward.points, 0),
      rewards: communityRewards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/rewards/leaderboard', mockProtect, (req, res) => {
  try {
    // Get users from the same community
    const communityUsers = mockDB.users.filter(u => u.communityId === req.user.communityId);
    
    // Sort by reward points (descending)
    const leaderboard = communityUsers
      .map(user => ({
        _id: user._id,
        nickname: user.nickname,
        rewardPoints: user.rewardPoints
      }))
      .sort((a, b) => b.rewardPoints - a.rewardPoints);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Sync routes
app.post('/api/sync/trees', mockProtect, (req, res) => {
  try {
    const { trees } = req.body;
    
    if (!trees || !Array.isArray(trees)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of trees'
      });
    }
    
    const syncedTrees = [];
    
    // Process each tree
    for (const tree of trees) {
      // Check if tree with localId already exists
      const existingTreeIndex = mockDB.trees.findIndex(t => 
        t.localId === tree.localId && t.userId === req.user._id
      );
      
      if (existingTreeIndex !== -1) {
        // Update existing tree
        mockDB.trees[existingTreeIndex] = {
          ...mockDB.trees[existingTreeIndex],
          ...tree,
          updatedAt: new Date(),
          syncStatus: 'synced'
        };
        
        syncedTrees.push(mockDB.trees[existingTreeIndex]);
      } else {
        // Create new tree
        const newTree = {
          _id: `mock-tree-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: req.user._id,
          communityId: req.user.communityId,
          ...tree,
          verificationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'synced'
        };
        
        mockDB.trees.push(newTree);
        syncedTrees.push(newTree);
      }
    }
    
    res.status(200).json({
      success: true,
      count: syncedTrees.length,
      trees: syncedTrees
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
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
const server = app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, mockDB };

