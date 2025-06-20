export default {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: [
    'handlers.js',
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/_tests_/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
