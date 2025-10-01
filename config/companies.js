const fs = require('fs-extra');
const path = require('path');

const COMPANIES_CONFIG_FILE = path.join(__dirname, '../data/companies.json');

// Default company configurations
const DEFAULT_COMPANIES = {
  "Velir": {
    name: "Velir Studios, Inc.",
    address: "212 Elm Street, Suite 201",
    city: "Somerville, MA",
    project: "Velir Clients",
    latestInvoiceNumber: 586,
    googleSheetsValue: "Velir"
  },
  "Daily Kos": {
    name: "Kos Media, LLC",
    address: "436 14th Street",
    city: "Oakland, CA 94612, United States",
    project: "Daily Kos",
    latestInvoiceNumber: 14,
    googleSheetsValue: "Daily Kos"
  },
  "McGowan": {
    name: "McGowan Wholesale",
    address: "20595 Lorain Rd",
    city: "Fairview Park, OH 44126",
    project: "Hive",
    latestInvoiceNumber: 11,
    googleSheetsValue: "McGowan"
  },
  "travcoding": {
    name: "Preferred Guest Resorts LLC",
    address: "501 N Wynmore Road",
    city: "Winter Park, FL, 32789",
    project: "travcoding",
    latestInvoiceNumber: 117,
    googleSheetsValue: "travcoding"
  }
};

class CompanyManager {
  constructor() {
    this.companies = {};
    this.loadCompanies();
  }

  async loadCompanies() {
    try {
      await fs.ensureDir(path.dirname(COMPANIES_CONFIG_FILE));
      const exists = await fs.pathExists(COMPANIES_CONFIG_FILE);
      
      if (exists) {
        const data = await fs.readJson(COMPANIES_CONFIG_FILE);
        this.companies = data;
      } else {
        this.companies = DEFAULT_COMPANIES;
        await this.saveCompanies();
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      this.companies = DEFAULT_COMPANIES;
    }
  }

  async saveCompanies() {
    try {
      await fs.writeJson(COMPANIES_CONFIG_FILE, this.companies, { spaces: 2 });
    } catch (error) {
      console.error('Error saving companies:', error);
    }
  }

  getCompanyByGoogleSheetsValue(sheetsValue) {
    return Object.values(this.companies).find(company => 
      company.googleSheetsValue === sheetsValue
    );
  }

  getAllCompanies() {
    return this.companies;
  }

  async incrementInvoiceNumber(companyKey) {
    if (this.companies[companyKey]) {
      this.companies[companyKey].latestInvoiceNumber++;
      await this.saveCompanies();
      return this.companies[companyKey].latestInvoiceNumber;
    }
    throw new Error(`Company ${companyKey} not found`);
  }

  getCompanyByKey(companyKey) {
    return this.companies[companyKey];
  }
}

module.exports = new CompanyManager(); 