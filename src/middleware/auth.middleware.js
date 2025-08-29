const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to authenticate JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

/**
 * Middleware to check if user is a community leader
 */
const isCommunityLeader = (req, res, next) => {
  if (req.user && req.user.role === 'leader') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as a community leader'
    });
  }
};

module.exports = { protect, isCommunityLeader };

