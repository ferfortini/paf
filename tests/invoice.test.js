const request = require('supertest');
const app = require('../server');
const companyManager = require('../config/companies');
const googleSheetsService = require('../services/googleSheetsService');
const pdfGenerator = require('../services/pdfGenerator');

// Mock the Google Sheets service
jest.mock('../services/googleSheetsService');
jest.mock('../services/pdfGenerator');

// Helper function to create authenticated session
const createAuthenticatedSession = async () => {
  const agent = request.agent(app);
  await agent.post('/api/login').send({
    username: 'admin',
    password: 'password'
  });
  return agent;
};

describe('Invoice Generation System', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('API Endpoints', () => {
    test('GET /api/health should return health status', async () => {
      const agent = await createAuthenticatedSession();
      const response = await agent.get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invoice System is running');
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /api/companies should return company configurations', async () => {
      const agent = await createAuthenticatedSession();
      const response = await agent.get('/api/companies');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.companies).toBeDefined();
      expect(Object.keys(response.body.companies)).toHaveLength(4);
      
      // Check for expected companies
      expect(response.body.companies).toHaveProperty('Velir');
      expect(response.body.companies).toHaveProperty('Daily Kos');
      expect(response.body.companies).toHaveProperty('McGowan');
      expect(response.body.companies).toHaveProperty('travcoding');
    });

    test('GET /api/sheets should return available sheets', async () => {
      const mockSheets = ['January2024', 'February2024', 'March2024'];
      googleSheetsService.getAvailableSheets.mockResolvedValue(mockSheets);

      const agent = await createAuthenticatedSession();
      const response = await agent.get('/api/sheets');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sheets).toEqual(mockSheets);
    });

    test('GET /api/sheets should handle errors', async () => {
      googleSheetsService.getAvailableSheets.mockRejectedValue(new Error('API Error'));

      const agent = await createAuthenticatedSession();
      const response = await agent.get('/api/sheets');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Invoice Generation', () => {
    test('POST /api/generate-invoice should generate invoice successfully', async () => {
      const mockLineItems = [
        {
          consultantName: 'John Doe',
          companyName: 'Velir',
          actualHours: 40,
          clientRate: 100,
          amountToInvoice: 4000
        }
      ];

      const mockPdfBuffer = Buffer.from('fake-pdf-content');

      googleSheetsService.getSheetData.mockResolvedValue(mockLineItems);
      pdfGenerator.generateInvoice.mockResolvedValue(mockPdfBuffer);

      const response = await request(app)
        .post('/api/generate-invoice')
        .send({
          sheetName: 'January2024',
          companyKey: 'Velir'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toEqual(mockPdfBuffer);
    });

    test('POST /api/generate-invoice should require sheetName and companyKey', async () => {
      const response = await request(app)
        .post('/api/generate-invoice')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('POST /api/generate-invoice should handle invalid company', async () => {
      const response = await request(app)
        .post('/api/generate-invoice')
        .send({
          sheetName: 'January2024',
          companyKey: 'InvalidCompany'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Company not found');
    });

    test('POST /api/generate-invoice should handle no data found', async () => {
      googleSheetsService.getSheetData.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/generate-invoice')
        .send({
          sheetName: 'January2024',
          companyKey: 'Velir'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No data found');
    });
  });

  describe('Sheet Data Preview', () => {
    test('GET /api/sheet-data/:sheet/:company should return preview data', async () => {
      const mockData = [
        {
          consultantName: 'John Doe',
          companyName: 'Velir',
          actualHours: 40,
          clientRate: 100,
          amountToInvoice: 4000
        }
      ];

      googleSheetsService.getSheetData.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/sheet-data/January2024/Velir');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
      expect(response.body.totalAmount).toBe(4000);
      expect(response.body.company).toBeDefined();
    });

    test('GET /api/sheet-data/:sheet/:company should handle invalid company', async () => {
      const response = await request(app)
        .get('/api/sheet-data/January2024/InvalidCompany');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Company not found');
    });
  });

  describe('Company Manager', () => {
    test('should get company by Google Sheets value', () => {
      const company = companyManager.getCompanyByGoogleSheetsValue('Velir');
      expect(company).toBeDefined();
      expect(company.name).toBe('Velir Studios, Inc.');
    });

    test('should return null for non-existent company', () => {
      const company = companyManager.getCompanyByGoogleSheetsValue('NonExistent');
      expect(company).toBeUndefined();
    });

    test('should get company by key', () => {
      const company = companyManager.getCompanyByKey('Velir');
      expect(company).toBeDefined();
      expect(company.name).toBe('Velir Studios, Inc.');
    });

    test('should return undefined for non-existent key', () => {
      const company = companyManager.getCompanyByKey('NonExistent');
      expect(company).toBeUndefined();
    });
  });

  describe('Google Sheets Service', () => {
    test('should identify monthly sheets correctly', () => {
      const validSheets = ['January2024', 'February2024', 'March2024'];
      const invalidSheets = ['Sheet1', 'Data2024', 'January'];

      validSheets.forEach(sheet => {
        expect(googleSheetsService.isMonthlySheet(sheet)).toBe(true);
      });

      invalidSheets.forEach(sheet => {
        expect(googleSheetsService.isMonthlySheet(sheet)).toBe(false);
      });
    });

    test('should sort sheets chronologically', () => {
      const sheets = ['March2024', 'January2024', 'February2024'];
      const sorted = sheets.sort(googleSheetsService.compareSheetDates);
      
      expect(sorted).toEqual(['March2024', 'February2024', 'January2024']);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });

    test('should handle unhandled errors', async () => {
      // Mock a service to throw an error
      googleSheetsService.getAvailableSheets.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app).get('/api/sheets');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch sheets');
    });
  });
}); 