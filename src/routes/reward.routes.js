const express = require('express');
const router = express.Router();
const { 
  getUserRewards,
  getCommunityRewards,
  awardPoints,
  getLeaderboard
} = require('../controllers/reward.controller');
const { protect, isCommunityLeader } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Reward routes
router.get('/', getUserRewards);
router.get('/community', isCommunityLeader, getCommunityRewards);
router.post('/', isCommunityLeader, awardPoints);
router.get('/leaderboard', getLeaderboard);

module.exports = router;

