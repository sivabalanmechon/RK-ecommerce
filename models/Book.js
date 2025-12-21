const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Tech', 'Fiction'
  coverImage: { type: String, required: true }, // URL from Cloudinary
  
  // Pricing Logic
  originalPrice: { type: Number, required: true }, 
  discountPercent: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true }, // (original - discount)
  
  // Digital Product Logic
  googleDriveFileId: { type: String, required: true }, // The file ID to share
  
  // Analytics Helpers
  salesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);