const { google } = require('googleapis');
const path = require('path');
const fs = require('fs-extra');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  }

  async authenticate() {
    try {
      // First try to use API key if available
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (apiKey) {
        console.log('Using Google API key for authentication');
        this.sheets = google.sheets({ 
          version: 'v4', 
          key: apiKey
        });
        return;
      }

      // Fallback to service account if API key not available
      const keyFilePath = path.join(__dirname, '../credentials/service-account-key.json');
      const exists = await fs.pathExists(keyFilePath);
      
      if (!exists) {
        throw new Error('Neither Google API key nor service account key found. Please set GOOGLE_API_KEY in .env or place service-account-key.json in the credentials folder.');
      }

      const keyFile = await fs.readJson(keyFilePath);
      
      this.auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Google Sheets authentication error:', error);
      throw error;
    }
  }

  async getAvailableSheets() {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheets = response.data.sheets || [];
      const monthlySheets = sheets
        .map(sheet => sheet.properties.title)
        .filter(title => this.isMonthlySheet(title))
        .filter(title => title.includes('2025')) // Only show 2025 sheets
        .sort((a, b) => this.compareSheetDates(a, b));

      return monthlySheets;
    } catch (error) {
      console.error('Error fetching available sheets:', error);
      throw error;
    }
  }

  isMonthlySheet(sheetName) {
    // Match patterns like "June2025", "January2024", "June 2025", "January 2024", etc.
    const monthlyPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}$/;
    return monthlyPattern.test(sheetName);
  }

  compareSheetDates(a, b) {
    const months = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const getDate = (sheetName) => {
      const month = sheetName.replace(/\s*\d{4}$/, '').trim();
      const year = parseInt(sheetName.match(/\d{4}$/)[0]);
      return new Date(year, months[month] - 1);
    };

    return getDate(b) - getDate(a); // Sort descending (newest first)
  }

  async getSheetData(sheetName, companyName) {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      const range = `${sheetName}!A:H`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      // Skip header row
      const dataRows = rows.slice(1);
      // Debug: log first 3 rows
      console.log(`[DEBUG] First 3 rows from ${sheetName}:`, dataRows.slice(0, 3));

      // Filter rows for the specific company
      const companyRows = dataRows.filter(row => {
        // Column C (index 2) contains "Empresa" (Company Name)
        return row[2] && row[2].trim() === companyName;
      });

      // Map the data to our invoice format
      return companyRows.map(row => ({
        consultantName: row[0] || '', // Column A: Nombre
        companyName: row[2] || '', // Column C: Empresa
        actualHours: parseFloat(row[3]) || 0, // Column D: Horas Reales
        clientRate: row[5] ? parseFloat(row[5].replace(/[$,]/g, '')) : 0, // Column F: $ cliente
        amountToInvoice: row[7] ? parseFloat(row[7].replace(/[$,]/g, '')) : 0 // Column H: Importe a facturar
      })).filter(item => item.consultantName && item.actualHours > 0);

    } catch (error) {
      console.error(`Error fetching data for sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async getAllSheetData(sheetName) {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      const range = `${sheetName}!A:H`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      // Skip header row and map all data
      return rows.slice(1).map(row => ({
        consultantName: row[0] || '', // Column A: Nombre
        companyName: row[2] || '', // Column C: Empresa
        actualHours: parseFloat(row[3]) || 0, // Column D: Horas Reales
        clientRate: row[5] ? parseFloat(row[5].replace(/[$,]/g, '')) : 0, // Column F: $ cliente
        amountToInvoice: row[7] ? parseFloat(row[7].replace(/[$,]/g, '')) : 0 // Column H: Importe a facturar
      })).filter(item => item.consultantName && item.companyName && item.actualHours > 0);

    } catch (error) {
      console.error(`Error fetching all data for sheet ${sheetName}:`, error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService(); 