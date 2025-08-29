const Tree = require('../models/tree.model');
const Reward = require('../models/reward.model');
const User = require('../models/user.model');

/**
 * Sync offline tree data
 * @route POST /api/sync/trees
 * @access Private
 */
const syncTrees = async (req, res) => {
  try {
    const { trees } = req.body;
    
    if (!trees || !Array.isArray(trees) || trees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No trees provided for sync'
      });
    }

    const results = {
      created: [],
      updated: [],
      errors: []
    };

    // Process each tree
    for (const treeData of trees) {
      try {
        // Check if tree with localId already exists
        let tree = null;
        
        if (treeData.localId) {
          tree = await Tree.findOne({ 
            localId: treeData.localId,
            userId: req.user._id
          });
        }

        if (tree) {
          // Update existing tree
          Object.keys(treeData).forEach(key => {
            if (key !== '_id' && key !== 'userId' && key !== 'communityId') {
              tree[key] = treeData[key];
            }
          });
          
          tree.syncStatus = 'synced';
          await tree.save();
          results.updated.push(tree);
        } else {
          // Create new tree
          const newTree = await Tree.create({
            ...treeData,
            userId: req.user._id,
            communityId: req.user.communityId,
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
            description: `Planted a ${newTree.species} tree`,
            relatedTreeId: newTree._id
          });

          // Update user's reward points
          await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { rewardPoints: rewardPoints } }
          );
          
          results.created.push(newTree);
        }
      } catch (error) {
        console.error(`Error syncing tree: ${error.message}`);
        results.errors.push({
          tree: treeData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      results
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
 * Sync offline maintenance records
 * @route POST /api/sync/maintenance
 * @access Private
 */
const syncMaintenance = async (req, res) => {
  try {
    const { maintenanceRecords } = req.body;
    
    if (!maintenanceRecords || !Array.isArray(maintenanceRecords) || maintenanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No maintenance records provided for sync'
      });
    }

    const results = {
      added: [],
      errors: []
    };

    // Process each maintenance record
    for (const record of maintenanceRecords) {
      try {
        const { treeId, localTreeId, date, activity, notes, healthStatus } = record;
        
        // Find the tree by ID or localId
        let tree = null;
        
        if (treeId) {
          tree = await Tree.findById(treeId);
        } else if (localTreeId) {
          tree = await Tree.findOne({ 
            localId: localTreeId,
            userId: req.user._id
          });
        }

        if (!tree) {
          throw new Error('Tree not found');
        }

        // Check if user belongs to the same community
        if (tree.communityId !== req.user.communityId) {
          throw new Error('Not authorized to add maintenance to this tree');
        }

        const maintenanceRecord = {
          date: date || new Date(),
          activity,
          notes: notes || '',
          performedBy: req.user._id
        };

        tree.maintenanceRecords.push(maintenanceRecord);
        
        // Update health status if provided
        if (healthStatus) {
          tree.healthStatus = healthStatus;
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
        
        results.added.push({
          treeId: tree._id,
          maintenanceRecord
        });
      } catch (error) {
        console.error(`Error syncing maintenance: ${error.message}`);
        results.errors.push({
          record,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      results
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
 * Get all data for offline use
 * @route GET /api/sync/data
 * @access Private
 */
const getOfflineData = async (req, res) => {
  try {
    const { communityId } = req.user;
    
    // Get trees for the community
    const trees = await Tree.find({ communityId })
      .populate('userId', 'nickname')
      .populate('verifiedBy', 'nickname')
      .sort({ createdAt: -1 });
    
    // Get user's rewards
    const rewards = await Reward.find({ userId: req.user._id })
      .populate('relatedTreeId', 'species plantedDate')
      .sort({ createdAt: -1 });
    
    // Get community members
    const users = await User.find({ communityId })
      .select('nickname role rewardPoints');
    
    res.json({
      success: true,
      data: {
        trees,
        rewards,
        users,
        currentUser: {
          _id: req.user._id,
          nickname: req.user.nickname,
          communityId: req.user.communityId,
          role: req.user.role,
          rewardPoints: req.user.rewardPoints
        }
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
};

module.exports = {
  syncTrees,
  syncMaintenance,
  getOfflineData
};

