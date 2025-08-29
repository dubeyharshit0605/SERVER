const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  communityId: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  species: {
    type: String,
    required: true
  },
  plantedDate: {
    type: Date,
    required: true
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'needs-attention', 'critical'],
    default: 'healthy'
  },
  maintenanceRecords: [{
    date: {
      type: Date,
      required: true
    },
    activity: {
      type: String,
      required: true
    },
    notes: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  images: [String], // URLs to images
  notes: String,
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

// Create a geospatial index for location-based queries
treeSchema.index({ location: '2dsphere' });

const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree;

