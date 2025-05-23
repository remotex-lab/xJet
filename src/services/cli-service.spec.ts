/**
 * Imports
 */

import { resolve } from 'path';
import { parseArguments } from './cli.service';

/**
 * Mock dependencies
 */

jest.mock('yargs/helpers', () => ({
    hideBin: jest.fn((arr) => arr)
}));

/**
 * Tests
 */

describe('parseArguments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return default values when no arguments provided', () => {
        const result = parseArguments([]);

        expect(result).toEqual(expect.objectContaining({
            'c': 'D:\\Projects\\RemoteXLabs\\xJet\\xjet.config.ts',
            'config': 'D:\\Projects\\RemoteXLabs\\xJet\\xjet.config.ts'
        }));
    });

    test('should correctly parse config path and resolve it', () => {
        const configPath = 'src/index.ts';
        const result = parseArguments([ '--config', configPath ]);

        expect(result.config).toBe(resolve(configPath));
    });

    test('should handle multiple file patterns', () => {
        const files = [ 'src/**/*.spec.ts', 'tests/**/*.test.ts' ];
        const result = parseArguments([ '--files', ...files ]);

        expect(result.files).toEqual(files);
    });

    test('should parse boolean flags correctly', () => {
        const result = parseArguments([
            '--verbose',
            '--bail',
            '--watch',
            '--coverage'
        ]);

        expect(result).toEqual(expect.objectContaining({
            verbose: true,
            bail: true,
            watch: true,
            coverage: true
        }));
    });

    test('should handle filter pattern', () => {
        const filterPattern = 'auth.*';
        const result = parseArguments([ '--filter', filterPattern ]);

        expect(result.filter?.pop()).toBe(filterPattern);
    });

    test('should parse timeout value', () => {
        const timeout = 10000;
        const result = parseArguments([ '--timeout', timeout.toString() ]);

        expect(result.timeout).toBe(timeout);
    });

    test('should accept custom reporter', () => {
        const reporter = 'custom-reporter';
        const result = parseArguments([ '--reporter', reporter ]);

        expect(result.reporter).toBe(reporter);
    });

    test('should handle aliases correctly', () => {
        const result = parseArguments([
            '-v',  // verbose
            '-b',  // bail
            '-w',  // watch
            '-C'   // coverage
        ]);

        expect(result).toEqual(expect.objectContaining({
            verbose: true,
            bail: true,
            watch: true,
            coverage: true
        }));
    });

    test('should parse seed value', () => {
        const result = parseArguments([ '--randomize' ]);

        expect(result).toBeTruthy();
    });

    test('should handle suites filter pattern', () => {
        const suitesPattern = [ 'integration/*', 'e2e/*' ];
        const result = parseArguments([ '--suites', suitesPattern[0], suitesPattern[1] ]);

        expect(result.suites).toStrictEqual(suitesPattern);
    });

    test('should combine multiple options correctly', () => {
        const result = parseArguments([
            '--config', './custom-config.ts',
            '--filter', 'auth.*',
            '--verbose',
            '--timeout', '10000',
            '--coverage'
        ]);

        expect(result).toEqual(expect.objectContaining({
            config: resolve('./custom-config.ts'),
            filter: [ 'auth.*' ],
            verbose: true,
            timeout: 10000,
            coverage: true
        }));
    });
});
