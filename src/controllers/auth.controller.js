const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { nickname, communityId, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ nickname });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this nickname already exists'
      });
    }

    // Create new user
    const user = await User.create({
      nickname,
      communityId,
      password,
      role: role || 'member' // Default to member if role not specified
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          nickname: user.nickname,
          communityId: user.communityId,
          role: user.role,
          rewardPoints: user.rewardPoints,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
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
};

/**
 * Authenticate user & get token
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { nickname, password } = req.body;

    // Find user by nickname
    const user = await User.findOne({ nickname });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          nickname: user.nickname,
          communityId: user.communityId,
          role: user.role,
          rewardPoints: user.rewardPoints,
          token: generateToken(user._id)
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
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          nickname: user.nickname,
          communityId: user.communityId,
          role: user.role,
          rewardPoints: user.rewardPoints,
          createdAt: user.createdAt
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
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.nickname = req.body.nickname || user.nickname;
      user.communityId = req.body.communityId || user.communityId;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          nickname: updatedUser.nickname,
          communityId: updatedUser.communityId,
          role: updatedUser.role,
          rewardPoints: updatedUser.rewardPoints,
          token: generateToken(updatedUser._id)
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
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};

