require('dotenv').config(); // Load .env variables
const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'config', 'service-account-key.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function testShare() {
    console.log("1. 🟢 Starting Drive Test...");
    console.log("   - Looking for key at:", KEY_FILE_PATH);

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });

        const drive = google.drive({ version: 'v3', auth });
        
        // ⚠️ REPLACE THIS with the Google Drive File ID you pasted in your Admin Panel
        const TEST_FILE_ID = 'PASTE_YOUR_FILE_ID_HERE'; 
        
        // ⚠️ REPLACE THIS with your personal email to test
        const TEST_EMAIL = 'your-email@gmail.com'; 

        console.log(`2. 🟡 Attempting to share File ID: ${TEST_FILE_ID}`);
        console.log(`   - Target Email: ${TEST_EMAIL}`);

        const res = await drive.permissions.create({
            fileId: TEST_FILE_ID,
            requestBody: {
                role: 'reader',
                type: 'user',
                emailAddress: TEST_EMAIL,
            },
        });

        console.log("3. 🚀 SUCCESS! Google Response:", res.data);
        console.log("✅ Check your email now. You should have access.");

    } catch (error) {
        console.log("========================================");
        console.log("🔥 FAILURE: The Robot cannot share the file.");
        console.log("Reason:", error.message);
        console.log("========================================");
        
        if (error.message.includes('autodetect')) {
            console.log("💡 TIP: check if 'service-account-key.json' exists in backend/config/");
        }
        if (error.message.includes('priorities')) {
             console.log("💡 TIP: The Robot is not an Editor of this file.");
             console.log("   -> Go to Google Drive -> Right Click File -> Share");
             console.log("   -> Add the Robot's email (from the json file) as EDITOR.");
        }
        if (error.message.includes('File not found')) {
            console.log("💡 TIP: The File ID is wrong.");
        }
    }
}

testShare();