/**
 * Imports
 */

import EventEmitter from 'events';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import {
    wrapAllFunctions,
    parseConfigurationFile,
    patchEventEmitterErrors,
    wrapFunctionWithSourceMap
} from '@configuration/parse.configuration';

/**
 * Mock dependencies
 */

jest.mock('@remotex-labs/xmap');
jest.mock('@services/vm.service');
jest.mock('@services/transpiler.service');
jest.mock('@errors/vm-runtime.error', () => {
    return {
        VMRuntimeError: jest.fn()
    };
});


/**
 * Tests
 */

describe('parseConfigurationFile', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully parse a configuration file', async() => {
        // Mock implementation setup
        const mockCode = 'test-code';
        const mockSourceMap = JSON.stringify({ mappings: [ 'test-mapping' ] });
        const mockConfig = { testKey: 'testValue' };

        (transpileFile as jest.Mock).mockResolvedValue({
            code: mockCode,
            sourceMap: mockSourceMap
        });

        (sandboxExecute as jest.Mock).mockImplementation(async(_, context) => {
            context.module.exports.default = mockConfig;
        });

        // Execute test
        const result = await parseConfigurationFile('test-file.ts');

        // Assertions
        expect(result).toEqual(mockConfig);
        expect(transpileFile).toHaveBeenCalledWith('test-file.ts', expect.any(Object));
        expect(sandboxExecute).toHaveBeenCalled();
    });

    test('should return empty object when source map has no mappings', async() => {
        // Mock empty source map
        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'test-code',
            sourceMap: JSON.stringify({ mappings: [] })
        });

        const result = await parseConfigurationFile('test-file.ts');

        expect(result).toEqual({});
        expect(sandboxExecute).not.toHaveBeenCalled();
    });

    test('should throw VMRuntimeError when sandbox execution fails', async() => {
        const mockError = new Error('Sandbox execution failed');
        const mockSourceMap = JSON.stringify({ mappings: [ 'test-mapping' ] });

        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'test-code',
            sourceMap: mockSourceMap
        });

        (sandboxExecute as jest.Mock).mockRejectedValue(mockError);
        (SourceService as jest.Mock).mockImplementation(() => ({}));

        try {
            await parseConfigurationFile('test-file.ts');
        } catch {
            expect(VMRuntimeError).toBeCalledTimes(1);
        }
    });
});

describe('Function Wrapping Utilities', () => {
    let mockSourceMap: SourceService;

    beforeEach(() => {
        mockSourceMap = {
            getOriginalPosition: jest.fn()
        } as unknown as SourceService;
    });

    describe('wrapFunctionWithSourceMap', () => {
        test('should handle synchronous functions that succeed', () => {
            const syncFn = async(x: number) => x * 2;
            const wrapped = wrapFunctionWithSourceMap(syncFn, mockSourceMap);

            expect(wrapped(5)).resolves.toBe(10);
        });

        test('should handle async functions that succeed', async() => {
            const asyncFn = async(x: number) => x * 2;
            const wrapped = wrapFunctionWithSourceMap(asyncFn, mockSourceMap);

            await expect(wrapped(5)).resolves.toBe(10);
        });

        test('should wrap synchronous errors with VMRuntimeError', () => {
            const errorFn = async() => {
                throw new Error('Test error');
            };
            const wrapped = wrapFunctionWithSourceMap(errorFn, mockSourceMap);

            expect(() => wrapped()).rejects.toBeInstanceOf(VMRuntimeError);
        });

        test('should wrap asynchronous errors with VMRuntimeError', async() => {
            const asyncErrorFn = async() => {
                throw new Error('Async test error');
            };
            const wrapped = wrapFunctionWithSourceMap(asyncErrorFn, mockSourceMap);

            await expect(wrapped()).rejects.toBeInstanceOf(VMRuntimeError);
        });

        test('should preserve function parameters and return types', async() => {
            const complexFn = async(a: number, b: string): Promise<string> => `${ a }-${ b }`;
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

        test('should wrap nested functions', async() => {
            const nestedObj = {
                level1: {
                    fn: async(x: number) => x + 1,
                    level2: {
                        fn: async(x: number) => x * 2
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

        test('should handle arrays of functions', async() => {
            const obj = {
                functions: [
                    async(x: number) => x + 1,
                    async(x: number) => x * 2
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

describe('patchEventEmitterErrors', () => {
    let sourceMap: jest.Mocked<SourceService>;
    let originalEmit: typeof EventEmitter.prototype.emit;

    beforeEach(() => {
        // Store original emit method before each test
        originalEmit = EventEmitter.prototype.emit;

        // Setup mocks
        sourceMap = new SourceService('') as jest.Mocked<SourceService>;
        (VMRuntimeError as unknown as jest.Mock).mockImplementation((error) => ({
            isNotFrameworkError: jest.fn().mockReturnValue(true),
            error
        }));
    });

    afterEach(() => {
        // Restore original emit method after each test
        EventEmitter.prototype.emit = originalEmit;
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('should patch EventEmitter.prototype.emit', () => {
        // When
        patchEventEmitterErrors(sourceMap);

        // Then
        expect(EventEmitter.prototype.emit).not.toBe(originalEmit);
    });

    test('should call original emit with correct arguments', () => {
        // Given
        const emitter = new EventEmitter();
        const spy = jest.spyOn(EventEmitter.prototype, 'emit');
        const eventType = 'test-event';
        const arg1 = { data: 'test' };
        const arg2 = 123;

        // When
        patchEventEmitterErrors(sourceMap);
        emitter.emit(eventType, arg1, arg2);

        // Then - original emit should be called with the same arguments
        expect(spy).toHaveBeenCalledWith(eventType, arg1, arg2);
    });

    test('should handle errors correctly when original emit throws', () => {
        // Given
        const emitter = new EventEmitter();
        const testError = new Error('Test error');

        // Mock original emit to throw an error
        EventEmitter.prototype.emit = jest.fn().mockImplementation(() => {
            throw testError;
        });

        // When
        patchEventEmitterErrors(sourceMap);

        // Then - should create VMRuntimeError and check if it's not a framework error
        expect(() => {
            emitter.emit('error-event', {});
        }).toThrow();

        expect(VMRuntimeError).toHaveBeenCalledWith(testError, sourceMap, false);
    });

    test('should throw VMRuntimeError when error is not a framework error', () => {
        // Given
        const emitter = new EventEmitter();
        const testError = new Error('Test error');

        // Mock original emit to throw an error
        EventEmitter.prototype.emit = jest.fn().mockImplementation(() => {
            throw testError;
        });;

        // Mock VMRuntimeError to report it's not a framework error
        (VMRuntimeError as unknown as jest.Mock).mockImplementation(() => ({
            isNotFrameworkError: jest.fn().mockReturnValue(true),
            toString: () => 'VMRuntimeError'
        }));

        // When
        patchEventEmitterErrors(sourceMap);

        // Then
        expect(() => {
            emitter.emit('error-event', {});
        }).toThrow('VMRuntimeError');
    });

    test('should return result from original emit when no error occurs', () => {
        // Given
        const emitter = new EventEmitter();
        emitter.on('test', () => {
        }); // Add listener so emit returns true

        // When
        patchEventEmitterErrors(sourceMap);
        const result = emitter.emit('test');

        // Then
        expect(result).toBe(true);
    });
});
