// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
// Import the pre-configured upload middleware
const upload = require('../config/cloudinary');

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
// @access  Public (or Private if you add auth middleware)
router.post('/', upload.single('image'), (req, res) => {
  try {
    // Multer + Cloudinary have done the work.
    // req.file contains information about the uploaded file in Cloudinary.
    
    console.log('File uploaded to Cloudinary:', req.file.path);

    // We return the secure Cloudinary URL back to the frontend
    res.send({
      image: req.file.path, // .path holds the secure URL in cloudinary storage engine
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).send({ message: 'Upload failed' });
  }
});

module.exports = router;