// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// 1. Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bookstore_uploads', // The folder name in your Cloudinary dashboard
    // Use 'auto' so it detects if it's an image (jpg, png) or a raw file (pdf)
    resource_type: 'auto', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'], 
    // Optional: Transformation for images to save space
    // transformation: [{ width: 1000, crop: "limit" }], 
  },
});

// 3. Initialize Multer with Cloudinary storage
const upload = multer({ storage: storage });

module.exports = upload;