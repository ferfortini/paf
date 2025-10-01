const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

class PDFGenerator {
  constructor() {
    this.logoPath = path.join(__dirname, '..', 'images', 'PAFLOGO.png');
  }

  async generateInvoice(invoiceData) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 1600 });
      
      // Generate HTML content
      const htmlContent = this.generateHTML(invoiceData);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  generateHTML(invoiceData) {
    const {
      invoiceNumber,
      invoiceDate,
      company,
      project,
      month,
      year,
      lineItems,
      manualExpenses = [],
      lineItemsTotal,
      manualExpensesTotal,
      totalAmount
    } = invoiceData;

    // Convert logo to base64 for embedding
    const logoBase64 = this.getLogoBase64();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
          }
          
          .logo {
            width: 200px;
            height: auto;
          }
          
          .invoice-info {
            text-align: right;
          }
          
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          
          .invoice-details {
            font-size: 14px;
            color: #666;
          }
          
          .billing-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          
          .bill-to, .payable-to {
            flex: 1;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          
          .company-info {
            font-size: 14px;
            line-height: 1.6;
          }
          
          .project-info {
            margin-bottom: 30px;
          }
          
          .project-label {
            font-weight: bold;
            color: #2c3e50;
          }
          
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .invoice-table th {
            background-color: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          
          .invoice-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          
          .invoice-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .total-row {
            background-color: #ecf0f1 !important;
            font-weight: bold;
          }
          
          .total-row td {
            border-top: 2px solid #2c3e50;
          }
          
          .amount-column {
            text-align: right;
          }
          
          .total-section {
            text-align: right;
            margin-top: 20px;
          }
          
          .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .notes-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          
          .notes-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="data:image/png;base64,${logoBase64}" alt="PAF Testing Corp Logo" class="logo">
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
              <div><strong>Date:</strong> ${invoiceDate}</div>
              <div><strong>Period:</strong> ${month} ${year}</div>
            </div>
          </div>
        </div>
        
        <div class="billing-section">
          <div class="bill-to">
            <div class="section-title">Invoice For:</div>
            <div class="company-info">
              ${company.name}<br>
              ${company.address}<br>
              ${company.city}
            </div>
          </div>
          <div class="payable-to">
            <div class="section-title">Payable To:</div>
            <div class="company-info">
              PAF TESTING CORP<br>
              255 RIVERTOWN SHOPS DR STE 102-204<br>
              ST JOHNS, FL 32259
            </div>
          </div>
        </div>
        
        <div class="project-info">
          <span class="project-label">Project:</span> ${project}
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th class="amount-column">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.consultantName}</td>
                <td>${item.actualHours.toFixed(2)}</td>
                <td>$${item.clientRate.toFixed(2)}</td>
                <td class="amount-column">$${item.amountToInvoice.toFixed(2)}</td>
              </tr>
            `).join('')}
            ${manualExpenses.length > 0 ? `
              <tr style="background-color: #f8f9fa;">
                <td colspan="4" style="font-weight: bold; padding: 15px 12px; border-top: 2px solid #2c3e50;">
                  Additional Expenses
                </td>
              </tr>
              ${manualExpenses.map(expense => `
                <tr>
                  <td>${expense.description}</td>
                  <td>-</td>
                  <td>-</td>
                  <td class="amount-column">$${expense.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            ` : ''}
            <tr class="total-row" style="background-color: #2c3e50; color: black; font-weight: bold;">
              <td colspan="3"><strong>Total Amount</strong></td>
              <td class="amount-column"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="notes-section">
          <div class="notes-title">Notes:</div>
          <div>Payment is due within 30 days of invoice date.</div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>PAF TESTING CORP | 255 RIVERTOWN SHOPS DR STE 102-204 | ST JOHNS, FL 32259</p>
        </div>
      </body>
      </html>
    `;
  }

  getLogoBase64() {
    try {
      const logoBuffer = fs.readFileSync(this.logoPath);
      return logoBuffer.toString('base64');
    } catch (error) {
      console.error('Error reading logo file:', error);
      return '';
    }
  }
}

module.exports = new PDFGenerator(); 