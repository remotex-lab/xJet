/**
 * Imports
 */

import { existsSync } from 'fs';
import ConsoleReporter from '@reports/console.reporter';
import { transpileFile } from '@services/transpiler.service';
import { getReporter, transpile } from '@handler/reporter.handler';

/**
 * Mock dependencies
 */

jest.mock('fs');
jest.mock('@remotex-labs/xmap');
jest.mock('@errors/xjet.error');
jest.mock('@services/vm.service');
jest.mock('@errors/vm-runtime.error');
jest.mock('@reports/console.reporter');
jest.mock('@services/transpiler.service');
jest.mock('@configuration/parse.configuration');

/**
 * Tests
 */


describe('Reporter Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getReporter', () => {
        test('should return ConsoleReporter when reporter is "default"', async () => {
            const mockConfig: any = { reporter: 'default' };

            const result = await getReporter(mockConfig);

            expect(ConsoleReporter).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(ConsoleReporter);
        });

        test('should return ConsoleReporter when reporter file does not exist', async () => {
            const mockConfig: any = { reporter: 'path/to/non-existent/reporter.js' };
            (existsSync as jest.Mock).mockReturnValueOnce(false);

            const result = await getReporter(mockConfig);

            expect(existsSync).toHaveBeenCalledWith(mockConfig.reporter);
            expect(ConsoleReporter).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(ConsoleReporter);
        });
    });

    describe('transpile', () => {
        test('should call transpileFile with correct parameters', async () => {
            const mockReporterPath = 'path/to/reporter.js';
            const mockTranspileResult = { code: 'transpiled code', sourceMap: {} };

            (transpileFile as jest.Mock).mockResolvedValueOnce(mockTranspileResult);

            const result = await transpile(mockReporterPath);

            expect(transpileFile).toHaveBeenCalledWith(
                mockReporterPath,
                {
                    minify: false,
                    platform: 'node',
                    logLevel: 'silent',
                    packages: 'external'
                }
            );
            expect(result).toBe(mockTranspileResult);
        });
    });
});
