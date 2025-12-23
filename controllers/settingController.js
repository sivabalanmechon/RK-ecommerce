const SystemSetting = require('../models/Systemsettings');

// Helper to get or create settings
const getSettingsDoc = async () => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({});
  }
  return settings;
};

// @desc    Get All Site Settings (Public)
// @route   GET /api/settings
// @access  Public
exports.getSiteSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Site Configuration
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSiteSettings = async (req, res) => {
  const { 
    siteName, 
    logo, 
    phone, 
    email, 
    address, 
    socialLinks,
    isLoginEnabled 
  } = req.body;

  try {
    const settings = await getSettingsDoc();

    // Update fields directly
    // Note: We assign them directly so empty strings overwite old values (which is desired for clearing fields)
    settings.siteName = siteName;
    settings.logo = logo;
    settings.phone = phone;
    settings.email = email;
    settings.address = address;
    if (typeof isLoginEnabled !== 'undefined') {
        settings.isLoginEnabled = isLoginEnabled;
    }
    
    // For nested objects like socialLinks, we ensure it's not undefined
    if (socialLinks) {
        settings.socialLinks = {
            facebook: socialLinks.facebook || '',
            instagram: socialLinks.instagram || '',
            twitter: socialLinks.twitter || ''
        };
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};