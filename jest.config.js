module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'public/app.js',
    'server.js',
    '!**/node_modules/**',
    '!**/backups/**'
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 80,
      functions: 100,
      statements: 85
    }
  }
};