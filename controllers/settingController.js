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
  console.log("Received Body:", req.body); // 👈 Debugging Line

  const { 
    siteName, 
    logo, 
    phone, 
    email, 
    address, 
    socialLinks,
    // Extract BOTH possible names to be safe
    isLoginEnabled, 
    forceLogin 
  } = req.body;

  try {
    const settings = await getSettingsDoc();

    settings.siteName = siteName;
    settings.logo = logo;
    settings.phone = phone;
    settings.email = email;
    settings.address = address;

    // --- CRITICAL FIX START ---
    // 1. Check if we received the value under EITHER name
    const incomingLoginStatus = isLoginEnabled !== undefined ? isLoginEnabled : forceLogin;

    // 2. Explicitly check if it is defined before updating
    if (incomingLoginStatus !== undefined) {
        // 3. Force it to be a real Boolean (fixes the "false" string issue)
        settings.isLoginEnabled = String(incomingLoginStatus) === 'true';
    }
    // --- CRITICAL FIX END ---

    if (socialLinks) {
        settings.socialLinks = {
            facebook: socialLinks.facebook || '',
            instagram: socialLinks.instagram || '',
            twitter: socialLinks.twitter || ''
        };
    }

    const updatedSettings = await settings.save();
    console.log("Saved Settings:", updatedSettings); // 👈 Verify what was saved
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};