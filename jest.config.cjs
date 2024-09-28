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
        '^@const/(.*)$': '<rootDir>/src/core/const/$1',
        '^@errors/(.*)$': '<rootDir>/src/core/errors/$1',
        '^@models/(.*)$': '<rootDir>/src/core/models/$1',
        '^@states/(.*)$': '<rootDir>/src/core/states/$1',
        '^@reports/(.*)$': '<rootDir>/src/reports/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@directives/(.*)$': '<rootDir>/src/directives/$1',
        '^@services/(.*)$': '<rootDir>/src/core/services/$1',
        '^@providers/(.*)$': '<rootDir>/src/core/providers/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@configuration/(.*)$': '<rootDir>/src/configuration/$1'
    },
};
