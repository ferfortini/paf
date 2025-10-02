# Vercel Deployment Guide

## 🚀 **Quick Deploy to Vercel**

### 1. **Install Vercel CLI**
```bash
npm i -g vercel
```

### 2. **Login to Vercel**
```bash
vercel login
```

### 3. **Deploy**
```bash
vercel
```

## 🔧 **Environment Variables Setup**

In your Vercel dashboard, add these environment variables:

### Required Variables:
```
LOGIN_USERNAME=admin
LOGIN_PASSWORD=Trading4L1f3!!
SESSION_SECRET=883931bf175c87dce7527556d3a403755cb737692d5a1cdf540ad3d6a9b4b681
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id
GOOGLE_API_KEY=your_actual_api_key
NODE_ENV=production
```

### How to Add Environment Variables:
1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Go to "Environment Variables"
4. Add each variable with its value
5. Make sure to set them for "Production" environment

## 📁 **Files Created for Vercel**

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to ignore during deployment

## ⚠️ **Important Notes**

1. **Google API Key**: Make sure you have a valid Google API key
2. **Spreadsheet ID**: Use your actual Google Sheets spreadsheet ID
3. **Session Storage**: Uses memory storage (not persistent across serverless function restarts)
4. **File Uploads**: PDF generation works but files are temporary

## 🧪 **Testing Deployment**

After deployment:
1. Visit your Vercel URL
2. Login with: `admin` / `Trading4L1f3!!`
3. Test invoice generation

## 🔍 **Troubleshooting**

### Common Issues:
1. **500 Error**: Check environment variables
2. **403 Google API Error**: Verify API key and spreadsheet ID
3. **Session Issues**: Sessions reset on serverless function restart

### Debug Steps:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Test Google API key separately
4. Check spreadsheet permissions
