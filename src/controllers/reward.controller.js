const Reward = require('../models/reward.model');
const User = require('../models/user.model');

/**
 * Get rewards for the current user
 * @route GET /api/rewards
 * @access Private
 */
const getUserRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ userId: req.user._id })
      .populate('relatedTreeId', 'species plantedDate')
      .populate('awardedBy', 'nickname')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rewards.length,
      rewards
    });
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
 * Get rewards for a community (leaders only)
 * @route GET /api/rewards/community
 * @access Private/Leader
 */
const getCommunityRewards = async (req, res) => {
  try {
    // Check if user is a community leader
    if (req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view community rewards'
      });
    }

    const { communityId } = req.user;
    
    const rewards = await Reward.find({ communityId })
      .populate('userId', 'nickname')
      .populate('relatedTreeId', 'species plantedDate')
      .populate('awardedBy', 'nickname')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rewards.length,
      rewards
    });
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
 * Award points to a user (leaders only)
 * @route POST /api/rewards
 * @access Private/Leader
 */
const awardPoints = async (req, res) => {
  try {
    // Check if user is a community leader
    if (req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to award points'
      });
    }

    const { userId, points, reason, description, relatedTreeId } = req.body;

    // Validate points
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive number'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Check if target user is in the same community
    if (targetUser.communityId !== req.user.communityId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to award points to users from other communities'
      });
    }

    // Create reward record
    const reward = await Reward.create({
      userId,
      communityId: req.user.communityId,
      points,
      reason,
      description: description || '',
      relatedTreeId: relatedTreeId || null,
      awardedBy: req.user._id
    });

    // Update user's reward points
    await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: points } }
    );

    res.status(201).json({
      success: true,
      reward
    });
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
 * Get leaderboard for a community
 * @route GET /api/rewards/leaderboard
 * @access Private
 */
const getLeaderboard = async (req, res) => {
  try {
    const { communityId } = req.user;
    
    // Get top users by reward points
    const leaderboard = await User.find({ communityId })
      .select('nickname rewardPoints role')
      .sort({ rewardPoints: -1 })
      .limit(20);

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
};

module.exports = {
  getUserRewards,
  getCommunityRewards,
  awardPoints,
  getLeaderboard
};

