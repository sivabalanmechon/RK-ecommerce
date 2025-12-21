const mongoose = require('mongoose');

const systemSettingsSchema = mongoose.Schema({
  siteName: { type: String, default: 'My BookStore' },
  logo: { type: String, default: '' }, // Changed from siteLogo to logo to match frontend
  
  // Contact Info
  phone: { type: String, default: '' }, // Changed from supportPhone
  email: { type: String, default: '' }, // Changed from supportEmail
  address: { type: String, default: '' },

  // Social Media Links
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },

  isLoginEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingsSchema);