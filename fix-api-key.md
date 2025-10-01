# Fix Google Sheets API Key Setup

## Current Issue
Your API key `AIzaSyB3nIJbLuSDGUN0BqyG5YeffM_bFik1bao` is not working because it's not properly configured.

## Step-by-Step Fix

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Select Your Project
- Make sure you're in the correct project where you created the API key

### 3. Enable Google Sheets API
- Go to "APIs & Services" > "Library"
- Search for "Google Sheets API"
- Click on "Google Sheets API"
- Click "Enable" button
- Wait for it to be enabled

### 4. Check API Key Configuration
- Go to "APIs & Services" > "Credentials"
- Find your API key: `AIzaSyB3nIJbLuSDGUN0BqyG5YeffM_bFik1bao`
- Click on it to edit
- Make sure:
  - "Google Sheets API" is listed under "API restrictions"
  - Or "Don't restrict key" is selected (for testing)

### 5. Alternative: Create New API Key
If the above doesn't work:
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "API Key"
- Copy the new key
- Update your `.env` file with the new key

### 6. Test Again
After making changes, run:
```bash
node test-sheets.js
```

## Quick Alternative: Use Service Account
If API key continues to fail, use the service account approach (more reliable):
- Follow the guide in `setup-service-account.md`

## Common Issues
1. **API not enabled**: Make sure Google Sheets API is enabled
2. **Wrong project**: Ensure you're in the correct Google Cloud project
3. **API restrictions**: Check that Google Sheets API is allowed for your key
4. **Billing**: Some APIs require billing to be enabled

## Test Command
```bash
node test-sheets.js
```

Expected success output:
```
Testing Google Sheets API...
Spreadsheet ID: 1NIfkQCcojEMH46t2VkiSmyiOhpZwBas2PzuB-L8yoXs
API Key: Present
Attempting to fetch spreadsheet metadata...
Success! Spreadsheet title: [Your Sheet Name]
Available sheets: [List of sheets]
``` 