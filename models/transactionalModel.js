const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
  utr: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  isUsed: { type: Boolean, default: false }, // Prevents reusing the same UTR
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Links to the order once matched
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);