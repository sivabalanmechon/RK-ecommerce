const path = require('path');
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// ==========================================
// CONFIG 1: LOCAL STORAGE (For PDFs Only)
// ==========================================
const localStorageEngine = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files saved to 'backend/uploads'
  },
  filename(req, file, cb) {
    // Naming: pdf-timestamp.pdf
    cb(null, `pdf-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filter: Allow ONLY PDFs for local storage
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Error: Local storage is for PDFs only!'));
    }
};

const uploadLocal = multer({ 
    storage: localStorageEngine, 
    fileFilter: pdfFilter 
});


// ==========================================
// CONFIG 2: CLOUDINARY (For All Images)
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryStorageEngine = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'rk-bookstore', // The folder name in your Cloudinary Dashboard
        resource_type: 'auto',  // ✨ ALLOWS ALL FORMATS (jpg, png, avif, webp, etc.)
        // allowed_formats: ['jpg', 'png'], // ❌ REMOVED RESTRICTION
    },
});

const uploadCloudinary = multer({ storage: cloudinaryStorageEngine });


// ==========================================
// ROUTES
// ==========================================

// ROUTE 1: Local Upload (PDFs)
// Endpoint: POST /api/upload
router.post('/', (req, res) => {
    uploadLocal.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const cleanPath = req.file.path.replace(/\\/g, '/');
        res.send({
            message: 'PDF Uploaded Locally',
            image: `/${cleanPath}`, 
        });
    });
});

// ROUTE 2: Cloudinary Upload (Images)
// Endpoint: POST /api/upload/cloudinary
router.post('/cloudinary', (req, res) => {
    const upload = uploadCloudinary.single('image');

    upload(req, res, function (err) {
        if (err) {
            console.log("🔥 Cloudinary Error:", err); // Log error for debugging
            return res.status(500).send({ 
                message: 'Image upload failed', 
                error: err.message || err 
            });
        }

        if (!req.file) {
             return res.status(400).send({ message: 'No file selected' });
        }

        // Success: Return the Cloudinary URL
        res.send({
            message: 'Image Uploaded to Cloudinary',
            image: req.file.path, 
        });
    });
});

module.exports = router;