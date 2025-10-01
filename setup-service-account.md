# Google Sheets Service Account Setup Guide

## Why Service Account is Better
- More secure than API keys
- Can access private Google Sheets
- Better for server applications

## Step-by-Step Setup

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Create a new project or select existing one
- Note down the Project ID

### 3. Enable Google Sheets API
- Go to "APIs & Services" > "Library"
- Search for "Google Sheets API"
- Click on it and press "Enable"

### 4. Create Service Account
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "Service Account"
- Fill in:
  - Service account name: `invoice-system`
  - Description: `Service account for invoice generation system`
- Click "Create and Continue"

### 5. Grant Permissions (Optional)
- Skip this step for now (click "Continue")
- Click "Done"

### 6. Generate Key
- Click on your new service account
- Go to "Keys" tab
- Click "Add Key" > "Create new key"
- Choose "JSON" format
- Click "Create"
- The file will download automatically

### 7. Place the Key File
- Rename the downloaded file to `service-account-key.json`
- Place it in the `credentials/` folder

### 8. Share Your Google Sheet
- Open your Google Sheets: https://docs.google.com/spreadsheets/d/1NIfkQCcojEMH46t2VkiSmyiOhpZwBas2PzuB-L8yoXs/edit
- Click "Share" button (top right)
- Add the service account email (found in the JSON file)
- Give it "Editor" access
- The email will look like: `invoice-system@your-project-id.iam.gserviceaccount.com`

### 9. Update Environment
- Remove the `GOOGLE_API_KEY` line from your `.env` file
- The system will automatically use the service account

## Quick Test
After setup, run:
```bash
node test-sheets.js
```

You should see success messages instead of errors. 