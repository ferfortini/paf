const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
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

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
fs.ensureDirSync(dataDir);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available sheets
app.get('/api/sheets', async (req, res) => {
  try {
    const sheets = await googleSheetsService.getAvailableSheets();
    res.json({ success: true, sheets });
  } catch (error) {
    console.error('Error fetching sheets:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch sheets' 
    });
  }
});

// Get companies
app.get('/api/companies', async (req, res) => {
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
app.post('/api/generate-invoice', async (req, res) => {
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
app.get('/api/sheet-data/:sheetName/:companyKey', async (req, res) => {
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
app.get('/api/health', (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Invoice System server running on port ${PORT}`);
  console.log(`📊 Available at: http://localhost:${PORT}`);
  console.log(`📋 API endpoints:`);
  console.log(`   GET  /api/sheets - Get available sheets`);
  console.log(`   GET  /api/companies - Get company configurations`);
  console.log(`   POST /api/generate-invoice - Generate PDF invoice`);
  console.log(`   GET  /api/sheet-data/:sheet/:company - Preview sheet data`);
});

module.exports = app; 