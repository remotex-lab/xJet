module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': [ '@swc/jest' ],
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!**/*.d.ts',
    ],
    testPathIgnorePatterns: [ '/lib/', '/node_modules/', '/dist/' ],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@global/(.*)$': '<rootDir>/src/global/$1',
        '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    },
};
