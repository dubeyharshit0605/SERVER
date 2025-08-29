const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  communityId: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['tree-planting', 'tree-maintenance', 'community-activity', 'other']
  },
  description: {
    type: String
  },
  relatedTreeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tree'
  },
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For offline sync
  localId: String,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending'],
    default: 'synced'
  }
}, {
  timestamps: true
});

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = Reward;

