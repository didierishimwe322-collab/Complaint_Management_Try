module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'index.js',
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 15000
};
