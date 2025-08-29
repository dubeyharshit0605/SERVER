const Tree = require('../models/tree.model');
const User = require('../models/user.model');
const Reward = require('../models/reward.model');

/**
 * Create a new tree record
 * @route POST /api/trees
 * @access Private
 */
const createTree = async (req, res) => {
  try {
    const {
      location,
      species,
      plantedDate,
      healthStatus,
      images,
      notes,
      localId
    } = req.body;

    const tree = await Tree.create({
      userId: req.user._id,
      communityId: req.user.communityId,
      location,
      species,
      plantedDate,
      healthStatus: healthStatus || 'healthy',
      images: images || [],
      notes: notes || '',
      localId,
      syncStatus: 'synced'
    });

    // Award points for planting a tree
    const rewardPoints = 10; // Default points for planting
    
    // Create reward record
    await Reward.create({
      userId: req.user._id,
      communityId: req.user.communityId,
      points: rewardPoints,
      reason: 'tree-planting',
      description: `Planted a ${species} tree`,
      relatedTreeId: tree._id
    });

    // Update user's reward points
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { rewardPoints: rewardPoints } }
    );

    res.status(201).json({
      success: true,
      tree,
      rewardPoints
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
 * Get all trees for a community
 * @route GET /api/trees
 * @access Private
 */
const getTrees = async (req, res) => {
  try {
    const { communityId } = req.user;
    
    // Optional filters
    const filters = {};
    
    if (req.query.verificationStatus) {
      filters.verificationStatus = req.query.verificationStatus;
    }
    
    if (req.query.healthStatus) {
      filters.healthStatus = req.query.healthStatus;
    }
    
    if (req.query.species) {
      filters.species = req.query.species;
    }

    // Find trees for the community with optional filters
    const trees = await Tree.find({
      communityId,
      ...filters
    })
      .populate('userId', 'nickname')
      .populate('verifiedBy', 'nickname')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: trees.length,
      trees
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
 * Get a single tree by ID
 * @route GET /api/trees/:id
 * @access Private
 */
const getTreeById = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id)
      .populate('userId', 'nickname')
      .populate('verifiedBy', 'nickname')
      .populate('maintenanceRecords.performedBy', 'nickname');

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }

    // Check if user belongs to the same community
    if (tree.communityId !== req.user.communityId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this tree record'
      });
    }

    res.json({
      success: true,
      tree
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
 * Update tree record
 * @route PUT /api/trees/:id
 * @access Private
 */
const updateTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }

    // Check if user is the owner or a community leader
    if (tree.userId.toString() !== req.user._id.toString() && req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tree record'
      });
    }

    // Update fields
    const {
      location,
      species,
      plantedDate,
      healthStatus,
      images,
      notes
    } = req.body;

    if (location) tree.location = location;
    if (species) tree.species = species;
    if (plantedDate) tree.plantedDate = plantedDate;
    if (healthStatus) tree.healthStatus = healthStatus;
    if (images) tree.images = images;
    if (notes !== undefined) tree.notes = notes;

    const updatedTree = await tree.save();

    res.json({
      success: true,
      tree: updatedTree
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
 * Add maintenance record to a tree
 * @route POST /api/trees/:id/maintenance
 * @access Private
 */
const addMaintenanceRecord = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }

    // Check if user belongs to the same community
    if (tree.communityId !== req.user.communityId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add maintenance to this tree'
      });
    }

    const { date, activity, notes } = req.body;

    const maintenanceRecord = {
      date: date || new Date(),
      activity,
      notes: notes || '',
      performedBy: req.user._id
    };

    tree.maintenanceRecords.push(maintenanceRecord);
    
    // Update health status if provided
    if (req.body.healthStatus) {
      tree.healthStatus = req.body.healthStatus;
    }

    await tree.save();

    // Award points for maintenance
    const rewardPoints = 5; // Default points for maintenance
    
    // Create reward record
    await Reward.create({
      userId: req.user._id,
      communityId: req.user.communityId,
      points: rewardPoints,
      reason: 'tree-maintenance',
      description: `Performed ${activity} on a tree`,
      relatedTreeId: tree._id
    });

    // Update user's reward points
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { rewardPoints: rewardPoints } }
    );

    res.status(201).json({
      success: true,
      tree,
      rewardPoints
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
 * Verify a tree record (community leaders only)
 * @route PUT /api/trees/:id/verify
 * @access Private/Leader
 */
const verifyTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }

    // Check if user is a community leader
    if (req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify trees'
      });
    }

    // Check if user belongs to the same community
    if (tree.communityId !== req.user.communityId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify trees from other communities'
      });
    }

    const { verificationStatus } = req.body;

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    tree.verificationStatus = verificationStatus;
    tree.verifiedBy = req.user._id;
    tree.verificationDate = new Date();

    await tree.save();

    // If verified, award additional points to the tree planter
    if (verificationStatus === 'verified') {
      const bonusPoints = 15; // Bonus points for verification
      
      // Create reward record
      await Reward.create({
        userId: tree.userId,
        communityId: tree.communityId,
        points: bonusPoints,
        reason: 'tree-planting',
        description: 'Bonus for verified tree planting',
        relatedTreeId: tree._id,
        awardedBy: req.user._id
      });

      // Update user's reward points
      await User.findByIdAndUpdate(
        tree.userId,
        { $inc: { rewardPoints: bonusPoints } }
      );
    }

    res.json({
      success: true,
      tree
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
 * Delete a tree record
 * @route DELETE /api/trees/:id
 * @access Private
 */
const deleteTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree not found'
      });
    }

    // Check if user is the owner or a community leader
    if (tree.userId.toString() !== req.user._id.toString() && req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tree record'
      });
    }

    await tree.remove();

    // Remove associated rewards
    await Reward.deleteMany({ relatedTreeId: tree._id });

    res.json({
      success: true,
      message: 'Tree record deleted'
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
  createTree,
  getTrees,
  getTreeById,
  updateTree,
  addMaintenanceRecord,
  verifyTree,
  deleteTree
};

