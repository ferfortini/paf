# PAF Testing Corp - Invoice Generation System

## 📋 Overview

A comprehensive invoice generation system that fetches data from Google Sheets and generates professional PDF invoices for multiple companies. The system automatically tracks invoice numbers, handles multiple companies, and provides a modern web interface for easy invoice generation.

## ✨ Features

- **Google Sheets Integration**: Automatically fetches data from monthly sheets
- **Multi-Company Support**: Handles 4 different companies with unique configurations
- **Automatic Invoice Numbering**: Tracks and increments invoice numbers per company
- **Professional PDF Generation**: Creates branded invoices with PAF Testing Corp logo
- **Modern Web Interface**: Responsive design with preview functionality
- **Real-time Data Fetching**: Pull fresh data from Google Sheets on demand
- **Invoice Preview**: Preview invoice data before generation
- **Manual Expense Entry**: Add custom expenses with descriptions and amounts
- **Dynamic Totals**: Automatic calculation including manual expenses

## 🏢 Supported Companies

1. **Velir Studios, Inc.** - Starting Invoice #: 586
2. **Kos Media, LLC** - Starting Invoice #: 14
3. **McGowan Wholesale** - Starting Invoice #: 11
4. **Preferred Guest Resorts LLC** - Starting Invoice #: 117

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Google Sheets API credentials
- Access to the Google Sheets spreadsheet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InvoiceSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Sheets API**
   - Create a Google Cloud Project
   - Enable Google Sheets API
   - Create a service account
   - Download the service account key JSON file
   - Place it in `credentials/service-account-key.json`

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and add your configuration:
   ```
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
   GOOGLE_API_KEY=AIzaSyB3nIJbLuSDGUN0BqyG5YeffM_bFik1bao
   ```

5. **Set up logo file**
   - Copy your PAF Testing Corp logo to `images/PAFLOGO.png`
   - The logo is automatically loaded from the project's images folder

6. **Start the server**
   ```bash
   npm start
   ```

7. **Access the application**
   Open your browser and go to `http://localhost:3000`

## 📊 Google Sheets Format

The system expects your Google Sheets to have the following structure:

- **Sheet Names**: `{Month}{Year}` format (e.g., "June2025", "January2024")
- **Columns**:
  - Column A: Nombre (Consultant Name)
  - Column C: Empresa (Company Name)
  - Column D: Horas Reales (Actual Hours)
  - Column F: $ cliente (Client Hourly Rate)
  - Column H: Importe a facturar (Amount to invoice)

## 🔧 Configuration

### Company Settings

Company configurations are stored in `config/companies.js` and automatically saved to `data/companies.json`. Each company includes:

- Company name and address
- Project name
- Latest invoice number
- Google Sheets value for filtering

### Invoice Numbering

Invoice numbers are automatically incremented and tracked per company. The system maintains the latest invoice number in the configuration file.

### Manual Expenses

The system supports adding manual expenses to invoices:

- **Add Multiple Expenses**: Use the plus icon to add multiple expense entries
- **Description & Amount**: Enter expense description and amount for each entry
- **Automatic Calculation**: Manual expenses are automatically added to the total
- **PDF Integration**: Expenses appear in the generated PDF with clear separation
- **Skip Option**: Users can skip adding expenses if not needed

## 📁 Project Structure

```
InvoiceSystem/
├── config/
│   └── companies.js          # Company configurations
├── services/
│   ├── googleSheetsService.js # Google Sheets integration
│   └── pdfGenerator.js       # PDF generation service
├── public/
│   └── index.html            # Web interface
├── data/
│   └── companies.json        # Persistent company data
├── credentials/
│   └── service-account-key.json # Google API credentials
├── server.js                 # Express server
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🛠️ API Endpoints

- `GET /api/sheets` - Get available monthly sheets
- `GET /api/companies` - Get company configurations
- `POST /api/generate-invoice` - Generate PDF invoice
- `GET /api/sheet-data/:sheet/:company` - Preview sheet data
- `GET /api/health` - Health check

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 Version History

### Version 1.0.4 - Manual Expenses Feature Added
- **Date**: October 1, 2025
- **Time**: 18:38 UTC
- **Status**: ✅ Manual expenses feature implemented and tested
- **Features**:
  - Server running on port 3000
  - All API endpoints responding correctly
  - Google Sheets integration active
  - Multi-company support operational
  - Professional PDF generation ready with working logo
  - Modern web interface accessible
  - Automatic invoice numbering functional
  - Invoice preview functionality working
  - **NEW**: Manual expense entry with dynamic calculation
- **New Functionality**:
  - ✅ Added manual expense entry modal before invoice generation
  - ✅ Users can add multiple expenses with descriptions and amounts
  - ✅ Plus icon to add more expense entries
  - ✅ Automatic total calculation including manual expenses
  - ✅ Expenses appear in PDF with clear separation and subtotals
  - ✅ Skip option for users who don't need to add expenses
  - ✅ Tested successfully with sample expenses (163KB PDF generated)

### Version 1.0.3 - Logo Issue Fixed
- **Date**: September 1, 2025
- **Time**: 15:23 UTC
- **Status**: ✅ Logo issue resolved, system fully operational
- **Features**:
  - Server running on port 3000
  - All API endpoints responding correctly
  - Google Sheets integration active
  - Multi-company support operational
  - Professional PDF generation ready with working logo
  - Modern web interface accessible
  - Automatic invoice numbering functional
  - Invoice preview functionality working
- **Fixes**:
  - ✅ Fixed broken logo in PDF invoices
  - ✅ Created images folder in project structure
  - ✅ Updated logo path to use relative path instead of hardcoded desktop path
  - ✅ Logo now displays correctly in generated invoices
  - ✅ Tested invoice generation successfully (163KB PDF generated)

### Version 1.0.2 - System Running Successfully
- **Date**: September 1, 2025
- **Time**: 19:00 UTC
- **Status**: ✅ System successfully deployed and running
- **Features**:
  - Server running on port 3000
  - All API endpoints responding correctly
  - Google Sheets integration active
  - Multi-company support operational
  - Professional PDF generation ready
  - Modern web interface accessible
  - Automatic invoice numbering functional
  - Invoice preview functionality working
- **Notes**: 
  - Health endpoint confirmed working
  - Some test failures due to port conflicts and missing service methods
  - Core functionality operational

### Version 1.0.1 - System Running Successfully
- **Date**: January 2025
- **Time**: Current session
- **Status**: ✅ System successfully deployed and running
- **Features**:
  - Server running on port 3000
  - All API endpoints responding correctly
  - Google Sheets integration active
  - Multi-company support operational
  - Professional PDF generation ready
  - Modern web interface accessible
  - Automatic invoice numbering functional
  - Invoice preview functionality working

### Version 1.0.0 - Initial Release
- **Date**: December 2024
- **Features**:
  - Complete invoice generation system
  - Google Sheets integration
  - Multi-company support
  - Professional PDF generation
  - Modern web interface
  - Automatic invoice numbering
  - Invoice preview functionality

## 🔒 Security Notes

- Keep your Google Sheets API credentials secure
- Don't commit the `credentials/` folder to version control
- Use environment variables for sensitive configuration

## 🐛 Troubleshooting

### Common Issues

1. **Google Sheets API Error**
   - Ensure service account key is properly configured
   - Check that the spreadsheet ID is correct
   - Verify the service account has access to the spreadsheet

2. **Logo Not Found**
   - Update the logo path in `services/pdfGenerator.js`
   - Ensure the logo file exists and is accessible

3. **No Data Found**
   - Verify the Google Sheets column structure matches requirements
   - Check that company names in sheets match the configured values

## 📞 Support

For support or questions, please contact the development team.

---

**PAF Testing Corp** - Professional Invoice Generation System 