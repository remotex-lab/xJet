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
        '^@errors/(.*)$': '<rootDir>/src/errors/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@providers/(.*)$': '<rootDir>/src/providers/$1',
        '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@configuration/(.*)$': '<rootDir>/src/configuration/$1',
    },
};
