/**
 * Imports
 */

import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Mock dependencies
 */

jest.mock('@remotex-labs/xmap');
jest.mock('@services/vm.service');
jest.mock('@services/transpiler.service');

/**
 * Tests
 */

describe('parseConfigurationFile', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully parse a configuration file', async () => {
        // Mock implementation setup
        const mockCode = 'test-code';
        const mockSourceMap = JSON.stringify({ mappings: [ 'test-mapping' ] });
        const mockConfig = { testKey: 'testValue' };

        (transpileFile as jest.Mock).mockResolvedValue({
            code: mockCode,
            sourceMap: mockSourceMap
        });

        (sandboxExecute as jest.Mock).mockImplementation(async (_, context) => {
            context.module.exports.default = mockConfig;
        });

        // Execute test
        const result = await parseConfigurationFile('test-file.ts');

        // Assertions
        expect(result).toEqual(mockConfig);
        expect(transpileFile).toHaveBeenCalledWith('test-file.ts', {
            banner: { js: '(function(module, exports) {' },
            footer: { js: '})(module, module.exports);' }
        });
        expect(sandboxExecute).toHaveBeenCalled();
    });

    test('should return empty object when source map has no mappings', async () => {
        // Mock empty source map
        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'test-code',
            sourceMap: JSON.stringify({ mappings: [] })
        });

        const result = await parseConfigurationFile('test-file.ts');

        expect(result).toEqual({});
        expect(sandboxExecute).not.toHaveBeenCalled();
    });

    test('should throw VMRuntimeError when sandbox execution fails', async () => {
        const mockError = new Error('Sandbox execution failed');
        const mockSourceMap = JSON.stringify({ mappings: [ 'test-mapping' ] });

        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'test-code',
            sourceMap: mockSourceMap
        });

        (sandboxExecute as jest.Mock).mockRejectedValue(mockError);
        (SourceService as jest.Mock).mockImplementation(() => ({}));

        await expect(parseConfigurationFile('test-file.ts'))
            .rejects
            .toThrow(VMRuntimeError);
    });
});
