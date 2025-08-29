const express = require('express');
const router = express.Router();
const { 
  syncTrees,
  syncMaintenance,
  getOfflineData
} = require('../controllers/sync.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Sync routes
router.post('/trees', syncTrees);
router.post('/maintenance', syncMaintenance);
router.get('/data', getOfflineData);

module.exports = router;

