const path = require('path');
const express = require('express');
const multer = require('multer');

const router = express.Router();

// 1. Configure Local Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in 'uploads' folder
  },
  filename(req, file, cb) {
    // Save as: fieldname-date.pdf
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// 2. Filter to allow only PDFs (Optional, but good for safety)
function checkFileType(file, cb) {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: PDFs Only!');
  }
}

const upload = multer({
  storage,
  // fileFilter: function (req, file, cb) { checkFileType(file, cb); }, // Uncomment to force PDF only
});

// 3. The Upload Route
// Frontend will POST to /api/upload
router.post('/', upload.single('image'), (req, res) => {
  // We send back the PATH to the file
  // Note: We add a leading slash so it's an absolute path relative to domain
  res.send({
    message: 'File Uploaded',
    image: `/${req.file.path.replace(/\\/g, '/')}`, 
  });
});

module.exports = router;