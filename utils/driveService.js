const { google } = require('googleapis');
const path = require('path');
const fs = require('fs'); // Import FS to check file existence

// --- 1. SMART PATH SELECTION ---
// Render stores Secret Files in /etc/secrets/ by default
const RENDER_SECRET_PATH = '/etc/secrets/service-account-key.json';
// Your local path (relative to this file)
const LOCAL_SECRET_PATH = path.join(__dirname, '../config/service-account-key.json');

let KEY_FILE_PATH;

if (fs.existsSync(RENDER_SECRET_PATH)) {
    console.log("☁️  Detected Render Environment: Using Secret File.");
    KEY_FILE_PATH = RENDER_SECRET_PATH;
} else {
    console.log("💻 Detected Local Environment: Using Config Folder.");
    KEY_FILE_PATH = LOCAL_SECRET_PATH;
}

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Grants "Viewer" permission to a Google Drive file for a specific email.
 * @param {string} fileId - The Google Drive File ID.
 * @param {string} email - The customer's email address.
 */
const grantAccess = async (fileId, email) => {
  try {
    console.log(`📂 Attempting to share File ID: ${fileId} with ${email}...`);

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader', // 'reader' = Viewer
        type: 'user',
        emailAddress: email,
      },
    });

    console.log(`✅ Access Granted Successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Drive API Error:', error.message);
    return false;
  }
};

module.exports = { grantAccess };