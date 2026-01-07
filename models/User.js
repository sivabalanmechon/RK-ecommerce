const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
  },
  // 👇 ADD THIS FIELD
  mobile: {
    type: String,
    required: [true, 'Please add a mobile number'], // Set to false if optional
    default: '' 
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  role: {
    type: String,
    default: 'customer', 
    enum: ['customer', 'admin'],
  },
  cart: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      qty: {
        type: Number,
        default: 1,
      },
    },
  ],
}, {
  timestamps: true,
});

// 1. Add this Virtual Field configuration
userSchema.virtual('sampleDownloads', {
  ref: 'SampleDownload', // Make sure this matches your Download Model name exactly
  localField: '_id',     // The User's ID
  foreignField: 'user',  // The field in Download model that links to user
  justOne: false         // We want an array of downloads
});

// 2. Ensure Virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);