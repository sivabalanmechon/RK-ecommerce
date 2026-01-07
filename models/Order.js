const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  
  // Changed from single 'book' to array of items
  orderItems: [{
    title: { type: String, required: true },
    price: { type: Number, required: true },
    coverImage: { type: String },
    book: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Book' },
  }],

  paymentId: { type: String },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },

  paymentProof: {
      type: String, // To store the UTR entered by user
      default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);