const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  
  // Basic short description for cards
  description: { type: String, required: true },
  
  // NEW: Detailed description for the Product Page
  detailedDescription: { type: String }, 
  
  category: { type: String, required: true },
  
  // Main Cover Image
  coverImage: { type: String, required: true }, 

  // NEW: Array of extra images (Side view, Back cover, etc.)
  bookImages: { 
    type: [String], 
    validate: {
      validator: function(v) {
        return v.length <= 7;
      },
      message: 'You can upload a maximum of 7 images.'
    }
  },

  // Pricing Logic
  originalPrice: { type: Number, required: true }, 
  discountPercent: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true },
  offerExpiresAt: {
    type: Date,
    required: false, // Optional: If not set, we won't show the timer
  },
  futurePrice: {
    type: Number,
    required: false, // Optional: The price displayed as "Price will be..."
  },

  // Digital Product Logic (The Paid File)
  googleDriveFileId: { type: String, required: true }, 

  // NEW: The Sample PDF URL (Use Cloudinary URL here)
  samplePdfUrl: { type: String }, 

  // Analytics Helpers
  salesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);