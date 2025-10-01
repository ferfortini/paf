require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs-extra');

async function testGoogleSheets() {
  try {
    console.log('Testing Google Sheets API with Service Account...');
    console.log('Spreadsheet ID:', process.env.GOOGLE_SPREADSHEET_ID);
    
    // Load service account credentials
    const keyFilePath = path.join(__dirname, 'credentials/service-account-key.json');
    const exists = await fs.pathExists(keyFilePath);
    
    if (!exists) {
      throw new Error('Service account key file not found');
    }
    
    console.log('Service account key file found');
    const keyFile = await fs.readJson(keyFilePath);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Attempting to fetch spreadsheet metadata...');
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
    });

    console.log('Success! Spreadsheet title:', response.data.properties.title);
    console.log('Available sheets:', response.data.sheets.map(s => s.properties.title));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testGoogleSheets(); 