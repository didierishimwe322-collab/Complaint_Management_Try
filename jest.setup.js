// Set test environment variables
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_NAME = process.env.DB_NAME || 'complaint_management_system_test';
process.env.NODE_ENV = 'test';

// Suppress console logs during tests
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
}

// Extend default timeout for slower CI/local environments
jest.setTimeout(15000);
