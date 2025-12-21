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

module.exports = mongoose.model('User', userSchema);