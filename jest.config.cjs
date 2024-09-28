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
        '^@errors/(.*)$': '<rootDir>/src/core/errors/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@services/(.*)$': '<rootDir>/src/core/services/$1',
        '^@adapters/(.*)$': '<rootDir>/src/core/adapters/$1',
        '^@providers/(.*)$': '<rootDir>/src/core/providers/$1',
        '^@interfaces/(.*)$': '<rootDir>/src/core/interfaces/$1',
        '^@configuration/(.*)$': '<rootDir>/src/configuration/$1',
    },
};
