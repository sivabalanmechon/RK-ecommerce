const express = require('express');
const router = express.Router();
const { getAdminStats, getSampleDownloads } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getAdminStats);
router.get('/sample-downloads', protect, admin, getSampleDownloads);

module.exports = router;