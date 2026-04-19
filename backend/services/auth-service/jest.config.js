module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.js', '!src/tests/**'],
    testTimeout: 30000,
    verbose: true
};
