const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const session = require('express-session');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const googleSheetsService = require('./services/googleSheetsService');
const pdfGenerator = require('./services/pdfGenerator');
const companyManager = require('./config/companies');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax' // CSRF protection
  },
  // Use cookie-based sessions for Vercel serverless compatibility
  // No store = cookie-based sessions (persistent across function invocations)
}));

// Authentication middleware
function requireAuth(req, res, next) {
  // Check JWT token first (for Vercel serverless)
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key-change-this');
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
  }
  
  // Fallback to session-based auth (for local development)
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
}

// Ensure data directory exists (skip in Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const dataDir = path.join(__dirname, 'data');
  fs.ensureDirSync(dataDir);
}

// Routes

// Login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const validUsername = process.env.LOGIN_USERNAME || 'admin';
  const validPassword = process.env.LOGIN_PASSWORD || 'password';
  
  // Debug logging
  console.log('Login attempt:', { username, password });
  console.log('Expected credentials:', { validUsername, validPassword });
  console.log('Environment variables:', { 
    LOGIN_USERNAME: process.env.LOGIN_USERNAME, 
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD 
  });
  
  if (username === validUsername && password === validPassword) {
    // Create session for local development
    req.session.authenticated = true;
    req.session.username = username;
    
    // Create JWT token for Vercel serverless
    const token = jwt.sign(
      { username, authenticated: true }, 
      process.env.SESSION_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: token // Include JWT token for Vercel
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid username or password' 
    });
  }
});

// Logout API
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Could not log out' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  // Check JWT token first (for Vercel serverless)
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key-change-this');
      return res.json({ 
        authenticated: true,
        username: decoded.username
      });
    } catch (error) {
      // Token invalid, fall through to session check
    }
  }
  
  // Fallback to session-based auth (for local development)
  res.json({ 
    authenticated: !!(req.session && req.session.authenticated),
    username: req.session ? req.session.username : null
  });
});

// Main route - redirect to login if not authenticated
app.get('/', (req, res) => {
  // Check JWT token first (for Vercel serverless)
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key-change-this');
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
      // Token invalid, fall through to session check
    }
  }
  
  // Fallback to session-based auth (for local development)
  if (req.session && req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

// Test Google API connection
app.get('/api/test-google-api', requireAuth, async (req, res) => {
  try {
    console.log('Testing Google API connection...');
    console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_SPREADSHEET_ID present:', !!process.env.GOOGLE_SPREADSHEET_ID);
    
    // Test with a simple API call
    const { google } = require('googleapis');
    const sheets = google.sheets({ 
      version: 'v4', 
      key: process.env.GOOGLE_API_KEY
    });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
    });
    
    res.json({ 
      success: true, 
      message: 'Google API connection successful',
      spreadsheetTitle: response.data.properties?.title || 'Unknown'
    });
  } catch (error) {
    console.error('Google API test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Get available sheets
app.get('/api/sheets', requireAuth, async (req, res) => {
  try {
    console.log('Fetching sheets - Environment variables:');
    console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_SPREADSHEET_ID present:', !!process.env.GOOGLE_SPREADSHEET_ID);
    console.log('GOOGLE_SPREADSHEET_ID value:', process.env.GOOGLE_SPREADSHEET_ID);
    
    const sheets = await googleSheetsService.getAvailableSheets();
    res.json({ success: true, sheets });
  } catch (error) {
    console.error('Error fetching sheets:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch sheets' 
    });
  }
});

// Get companies
app.get('/api/companies', requireAuth, async (req, res) => {
  try {
    const companies = companyManager.getAllCompanies();
    res.json({ success: true, companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch companies' 
    });
  }
});

// Generate invoice
app.post('/api/generate-invoice', requireAuth, async (req, res) => {
  try {
    const { sheetName, companyKey, manualExpenses = [] } = req.body;

    if (!sheetName || !companyKey) {
      return res.status(400).json({
        success: false,
        error: 'Sheet name and company key are required'
      });
    }

    // Get company details
    const company = companyManager.getCompanyByKey(companyKey);
    if (!company) {
      return res.status(400).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Get sheet data for the company
    const lineItems = await googleSheetsService.getSheetData(sheetName, company.googleSheetsValue);
    
    if (lineItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this company in the selected month'
      });
    }

    // Calculate total amount from line items
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amountToInvoice, 0);
    
    // Calculate total amount from manual expenses
    const manualExpensesTotal = manualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Debug logging
    console.log('Manual expenses received:', manualExpenses);
    console.log('Manual expenses total:', manualExpensesTotal);
    console.log('Line items total:', lineItemsTotal);
    
    // Calculate grand total
    const totalAmount = lineItemsTotal + manualExpensesTotal;

    // Extract month and year from sheet name
    const monthMatch = sheetName.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})$/);
    if (!monthMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sheet name format'
      });
    }

    const month = monthMatch[1];
    const year = monthMatch[2];

    // Increment invoice number
    const invoiceNumber = await companyManager.incrementInvoiceNumber(companyKey);

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      invoiceDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      company,
      project: company.project,
      month,
      year,
      lineItems,
      manualExpenses,
      lineItemsTotal,
      manualExpensesTotal,
      totalAmount
    };

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateInvoice(invoiceData);

    // Create filename
    const filename = `Invoice_${companyKey}_${month}${year}_${invoiceNumber}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

    // Log the invoice generation
    console.log(`Invoice generated: ${filename} for ${company.name} - Amount: $${totalAmount.toFixed(2)}`);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice'
    });
  }
});

// Get sheet data for preview
app.get('/api/sheet-data/:sheetName/:companyKey', requireAuth, async (req, res) => {
  try {
    const { sheetName, companyKey } = req.params;

    const company = companyManager.getCompanyByKey(companyKey);
    if (!company) {
      return res.status(400).json({
        success: false,
        error: 'Company not found'
      });
    }

    const data = await googleSheetsService.getSheetData(sheetName, company.googleSheetsValue);
    const totalAmount = data.reduce((sum, item) => sum + item.amountToInvoice, 0);

    res.json({
      success: true,
      data,
      totalAmount,
      company
    });

  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sheet data'
    });
  }
});

// Health check endpoint
app.get('/api/health', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Invoice System is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Invoice System server running on port ${PORT}`);
    console.log(`📊 Available at: http://localhost:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   GET  /api/sheets - Get available sheets`);
    console.log(`   GET  /api/companies - Get company configurations`);
    console.log(`   POST /api/generate-invoice - Generate PDF invoice`);
    console.log(`   GET  /api/sheet-data/:sheet/:company - Preview sheet data`);
  });
}

module.exports = app; 