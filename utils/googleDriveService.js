const { google } = require('googleapis');
const path = require('path');

// Load credentials from the root folder
// IMPORTANT: Add 'credentials.json' to your .gitignore file so you don't leak secrets!
const KEY_FILE_PATH = path.join(__dirname, '../credentials.json');

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Grants 'Reader' permission to a Gmail address for a specific file.
 */
const grantAccess = async (fileId, userEmail) => {
  try {
    const res = await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: userEmail,
      },
      // sendNotificationEmail: true, // Google handles the email notification
    });
    console.log(`Access granted to ${userEmail} for file ${fileId}`);
    return res.data;
  } catch (error) {
    console.error('Google Drive API Error:', error.message);
    throw new Error('Failed to grant document access');
  }
};

module.exports = { grantAccess };