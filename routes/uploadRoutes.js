const path = require('path');
const express = require('express');
const multer = require('multer');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// 1. SINGLE UPLOAD (Keep this for Logo & Book Cover)
// Usage: axios.post('/api/upload', formData)
router.post('/', upload.single('image'), (req, res) => {
  res.send({
    message: 'Image uploaded',
    image: `/${req.file.path.replace(/\\/g, '/')}`,
  });
});

// 2. MULTIPLE UPLOAD (New!)
// Usage: axios.post('/api/upload/many', formData) -> field name must be 'images'
router.post('/many', upload.array('images', 10), (req, res) => {
  // Map through all files to get their paths
  const imagePaths = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
  
  res.send({
    message: 'Images uploaded',
    images: imagePaths, // Returns an array: ['/uploads/img1.jpg', '/uploads/img2.jpg']
  });
});

module.exports = router;