const express = require('express');
const router = express.Router();
const { 
  createTree,
  getTrees,
  getTreeById,
  updateTree,
  addMaintenanceRecord,
  verifyTree,
  deleteTree
} = require('../controllers/tree.controller');
const { protect, isCommunityLeader } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Tree routes
router.route('/')
  .post(createTree)
  .get(getTrees);

router.route('/:id')
  .get(getTreeById)
  .put(updateTree)
  .delete(deleteTree);

// Maintenance routes
router.post('/:id/maintenance', addMaintenanceRecord);

// Verification routes (leaders only)
router.put('/:id/verify', isCommunityLeader, verifyTree);

module.exports = router;

