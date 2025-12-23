const mongoose = require('mongoose');

const sampleDownloadSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  book: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true 
  },
  bookTitle: { type: String }, // Optional: for easier querying without populating
  downloadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('SampleDownload', sampleDownloadSchema);