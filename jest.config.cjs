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
        '^@ui/(.*)$': '<rootDir>/src/ui/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@schema/(.*)$': '<rootDir>/src/schema/$1',
        '^@errors/(.*)$': '<rootDir>/src/errors/$1',
        '^@reports/(.*)$': '<rootDir>/src/reports/$1',
        '^@targets/(.*)$': '<rootDir>/src/targets/$1',
        '^@handler/(.*)$': '<rootDir>/src/handler/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@providers/(.*)$': '<rootDir>/src/providers/$1',
        '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@configuration/(.*)$': '<rootDir>/src/configuration/$1',
    },
};
