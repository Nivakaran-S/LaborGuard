module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    // Only the top-level tests/ tree — ignore the legacy src/tests/* tests
    // that pre-date the integration/unit split and don't follow the new patterns.
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/', '/tests/performance/', '/src/tests/'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.js'],
    verbose: true,
};
