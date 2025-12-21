const express = require('express');
const router = express.Router();
const {
  getSiteSettings,
  updateSiteSettings,
} = require('../controllers/settingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSiteSettings) // Public: Anyone can read site name/logo
  .put(protect, admin, updateSiteSettings); // Private: Only Admin can update

module.exports = router;