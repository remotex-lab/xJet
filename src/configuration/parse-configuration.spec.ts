/**
 * Imports
 */

import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import {
    wrapAllFunctions,
    parseConfigurationFile,
    wrapFunctionWithSourceMap
} from '@configuration/parse.configuration';

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


describe('Function Wrapping Utilities', () => {
    let mockSourceMap: SourceService;

    beforeEach(() => {
        mockSourceMap = {
            // Add minimal required properties for testing
            getOriginalPosition: jest.fn(),
            // Add other required properties as needed
        } as unknown as SourceService;
    });

    describe('wrapFunctionWithSourceMap', () => {
        test('should handle synchronous functions that succeed', () => {
            const syncFn = (x: number) => x * 2;
            const wrapped = wrapFunctionWithSourceMap(syncFn, mockSourceMap);

            expect(wrapped(5)).resolves.toBe(10);
        });

        test('should handle async functions that succeed', async () => {
            const asyncFn = async (x: number) => x * 2;
            const wrapped = wrapFunctionWithSourceMap(asyncFn, mockSourceMap);

            await expect(wrapped(5)).resolves.toBe(10);
        });

        test('should wrap synchronous errors with VMRuntimeError', () => {
            const errorFn = async () => {
                throw new Error('Test error');
            };
            const wrapped = wrapFunctionWithSourceMap(errorFn, mockSourceMap);

            expect(() => wrapped()).rejects.toBeInstanceOf(VMRuntimeError);
        });

        test('should wrap asynchronous errors with VMRuntimeError', async () => {
            const asyncErrorFn = async () => {
                throw new Error('Async test error');
            };
            const wrapped = wrapFunctionWithSourceMap(asyncErrorFn, mockSourceMap);

            await expect(wrapped()).rejects.toBeInstanceOf(VMRuntimeError);
        });

        test('should preserve function parameters and return types', async () => {
            const complexFn = (a: number, b: string): string => `${a}-${b}`;
            const wrapped = wrapFunctionWithSourceMap(complexFn, mockSourceMap);

            await expect(wrapped(1, 'test')).resolves.toBe('1-test');
        });
    });

    describe('wrapAllFunctions', () => {
        test('should wrap all functions in a flat object', () => {
            const obj = {
                fn1: (x: number) => x + 1,
                fn2: (x: number) => x * 2,
                notAFunction: 'string'
            };

            const wrapped = wrapAllFunctions(obj, mockSourceMap);

            expect(typeof wrapped.fn1).toBe('function');
            expect(typeof wrapped.fn2).toBe('function');
            expect(wrapped.notAFunction).toBe('string');
        });

        test('should wrap nested functions', async () => {
            const nestedObj = {
                level1: {
                    fn: (x: number) => x + 1,
                    level2: {
                        fn: (x: number) => x * 2
                    }
                }
            };

            const wrapped = wrapAllFunctions(nestedObj, mockSourceMap);

            await expect(wrapped.level1.fn(5)).resolves.toBe(6);
            await expect(wrapped.level1.level2.fn(5)).resolves.toBe(10);
        });

        test('should handle circular references', () => {
            const obj: any = {
                fn: (x: number) => x + 1
            };
            obj.circular = obj;

            expect(() => wrapAllFunctions(obj, mockSourceMap)).not.toThrow();
            expect(typeof obj.fn).toBe('function');
        });

        test('should handle arrays of functions', async () => {
            const obj = {
                functions: [
                    (x: number) => x + 1,
                    (x: number) => x * 2
                ]
            };

            const wrapped = wrapAllFunctions(obj, mockSourceMap);

            await expect(wrapped.functions[0](5)).resolves.toBe(6);
            await expect(wrapped.functions[1](5)).resolves.toBe(10);
        });

        test('should handle null and undefined values', () => {
            const obj = {
                nullFn: null,
                undefinedFn: undefined,
                fn: (x: number) => x + 1
            };

            expect(() => wrapAllFunctions(obj, mockSourceMap)).not.toThrow();
            expect(obj.nullFn).toBeNull();
            expect(obj.undefinedFn).toBeUndefined();
        });

        test('should wrap functions that throw errors', () => {
            const obj = {
                errorFn: () => {
                    throw new Error('Test error');
                }
            };

            const wrapped = wrapAllFunctions(obj, mockSourceMap);

            expect(() => wrapped.errorFn()).toThrow(VMRuntimeError);
        });
    });
});
