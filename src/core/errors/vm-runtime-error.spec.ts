/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { frameworkProvider } from '@providers/framework.provider';

/**
 * Mock dependencies
 */

jest.mock('@errors/base.error');
jest.mock('@providers/framework.provider');

/**
 * Tests
 */

describe('VMRuntimeError', () => {
    // Mock setup
    let mockOriginalError: ErrorType;
    let mockSourceMapService: SourceService;
    let mockAggregateError: AggregateError;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock error
        mockOriginalError = {
            name: 'Error',
            message: 'Test error message',
            stack: 'Error: Test error message\n    at TestFunction (test.ts:10:15)',
            callStacks: [
                { getFileName: jest.fn().mockReturnValue('user-code.ts') }
            ]
        } as unknown as ErrorType;

        // Setup mock source map service
        mockSourceMapService = {
            // Add necessary mock methods/properties for SourceService
        } as unknown as SourceService;

        // Setup mock AggregateError with nested errors
        const nestedError1 = {
            name: 'Error',
            message: 'Nested error 1',
            stack: 'Error: Nested error 1\n    at TestFunction (test.ts:20:15)',
            callStacks: [
                { getFileName: jest.fn().mockReturnValue('user-code-nested.ts') }
            ]
        } as unknown as ErrorType;

        const nestedError2 = {
            name: 'Error',
            message: 'Nested error 2',
            stack: 'Error: Nested error 2\n    at TestFunction (test.ts:30:15)',
            callStacks: [
                { getFileName: jest.fn().mockReturnValue('framework.ts') }
            ]
        } as unknown as ErrorType;

        mockAggregateError = new AggregateError(
            [ nestedError1, nestedError2 ],
            'Aggregate error'
        );

        // Mock BaseError methods
        ((<any>BaseError).prototype.reformatStack as jest.Mock) = jest.fn();

        // Mock frameworkProvider method
        (frameworkProvider.isFrameworkSourceFile as jest.Mock) = jest.fn(fileName => {
            if(!fileName) {
                return true;
            }

            return fileName.includes('framework.ts');
        });
    });

    test('should extend BaseError', () => {
        const error = new VMRuntimeError(mockOriginalError, mockSourceMapService);
        expect(error).toBeInstanceOf(BaseError);
        expect(error).toBeInstanceOf(VMRuntimeError);
    });

    test('should call constructor with correct parameters', () => {
        new VMRuntimeError(mockOriginalError, mockSourceMapService);

        // Verify BaseError constructor was called with correct parameters
        expect(BaseError).toHaveBeenCalledWith('VMRuntimeError', mockOriginalError.message, mockSourceMapService);
    });

    test('should call reformatStack with correct parameters', () => {
        // Test with default includeFramework value (false)
        new VMRuntimeError(mockOriginalError, mockSourceMapService);
        expect((<any>BaseError).prototype.reformatStack).toHaveBeenCalledWith(mockOriginalError, false);

        // Reset mock
        jest.clearAllMocks();

        // Test with includeFramework value set to true
        new VMRuntimeError(mockOriginalError, mockSourceMapService, true);
        expect((<any>BaseError).prototype.reformatStack).toHaveBeenCalledWith(mockOriginalError, true);
    });

    test('should respect the includeFramework parameter', () => {
        new VMRuntimeError(mockOriginalError, mockSourceMapService);
        expect((<any>BaseError).prototype.reformatStack).toHaveBeenCalledWith(mockOriginalError, false);

        // Reset mock
        jest.clearAllMocks();

        new VMRuntimeError(mockOriginalError, mockSourceMapService, true);
        expect((<any>BaseError).prototype.reformatStack).toHaveBeenCalledWith(mockOriginalError, true);
    });

    test('should return the original error if it is already a VMRuntimeError', () => {
        const originalVMError = new VMRuntimeError(mockOriginalError, mockSourceMapService);
        jest.clearAllMocks(); // Clear first instantiation

        const recycledError = new VMRuntimeError(originalVMError as unknown as ErrorType, mockSourceMapService);

        // Should not have called BaseError constructor again
        expect(BaseError).not.toHaveBeenCalledWith('VMRuntimeError', expect.any(String), mockSourceMapService);

        // The returned error should be the same instance
        expect(recycledError).toBe(originalVMError);
    });

    test('should process AggregateError and create nested VMRuntimeError instances', () => {
        const error = new VMRuntimeError(mockAggregateError as unknown as ErrorType, mockSourceMapService);

        expect(error.errors).toBeDefined();
        expect(error.errors?.length).toBe(2);
        expect(error.errors?.[0]).toBeInstanceOf(VMRuntimeError);
        expect(error.errors?.[1]).toBeInstanceOf(VMRuntimeError);

        // Check that nested error messages are preserved
        expect(error.errors?.[0].message).toBe('Nested error 1');
        expect(error.errors?.[1].message).toBe('Nested error 2');
    });

    test('isNotFrameworkError should handle non-aggregate errors correctly', () => {
        const error = new VMRuntimeError(mockOriginalError, mockSourceMapService);

        // Since our mock returns false for 'user-code.ts', this should be true
        expect(error.isNotFrameworkError()).toBe(false);

        // Change the mock to simulate a framework file
        mockOriginalError.callStacks![0].getFileName = jest.fn().mockReturnValue('framework.ts');
        const frameworkError = new VMRuntimeError(mockOriginalError, mockSourceMapService);

        // This should return false as it's a framework error
        expect(frameworkError.isNotFrameworkError()).toBe(true);
    });

    test('isNotFrameworkError should handle AggregateError correctly', () => {
        const error = new VMRuntimeError(mockAggregateError as unknown as ErrorType, mockSourceMapService);

        // The first nested error is user code, so this should return true
        expect(error.isNotFrameworkError()).toBe(false);

        // Create an AggregateError where all nested errors are framework errors
        const allFrameworkError = {
            ...mockAggregateError,
            errors: [
                {
                    name: 'Error',
                    message: 'Framework Error',
                    callStacks: [{ getFileName: jest.fn().mockReturnValue('fraamework.ts') }]
                },
                {
                    name: 'Error',
                    message: 'Another Framework Error',
                    callStacks: [{ getFileName: jest.fn().mockReturnValue('faramework.ts') }]
                }
            ]
        };

        const frameworkAggError = new VMRuntimeError(allFrameworkError as unknown as ErrorType, mockSourceMapService);

        expect(frameworkAggError.isNotFrameworkError()).toBe(true);
    });

    test('should handle Symbol.for("nodejs.util.inspect.custom") for non-aggregate errors', () => {
        const error = <any> new VMRuntimeError(mockOriginalError, mockSourceMapService);

        // Mock the formattedStack property
        error.formattedStack = 'Formatted error stack';

        const inspectResult = error[Symbol.for('nodejs.util.inspect.custom')]();
        expect(inspectResult).toBe('Formatted error stack');

        // Test fallback to stack when formattedStack is not available
        delete error.formattedStack;
        const fallbackResult = error[Symbol.for('nodejs.util.inspect.custom')]();
        expect(fallbackResult).toBe(error.stack);
    });

    test('should handle Symbol.for("nodejs.util.inspect.custom") for aggregate errors', () => {
        const error = <any> new VMRuntimeError(mockAggregateError as unknown as ErrorType, mockSourceMapService);

        // Mock the formattedStack properties
        if (error.errors) {
            error.errors[0].formattedStack = 'Nested error 1 stack';
            error.errors[1].formattedStack = 'Nested error 2 stack';
        }

        const inspectResult = error[Symbol.for('nodejs.util.inspect.custom')]();

        // Verify it includes all the nested error information
        expect(inspectResult).toContain('VMRuntimeError Contains 2 nested errors');
        expect(inspectResult).toContain('Nested error 1 stack');
        expect(inspectResult).toContain('Nested error 2 stack');
    });
});
