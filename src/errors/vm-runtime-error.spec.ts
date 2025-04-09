/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { VMRuntimeError } from '@errors/vm-runtime.error';

/**
 * Mock dependencies
 */

jest.mock('@errors/base.error');

/**
 * Error class
 */

class TestError extends BaseError {
    constructor(message: string, sourceMap?: any) {
        super('TestError', message, sourceMap);
    }
}

/**
 * Tests
 */

describe('VMRuntimeError', () => {
    // Mock source map service
    const mockSourceMapService: SourceService = {
        getOriginalPosition: jest.fn()
        // Add other required methods from SourceService interface
    } as unknown as SourceService;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return the original error if it is already a BaseError', () => {
        // Arrange
        const baseError = new TestError('Test message');

        // Act
        const result = new VMRuntimeError(baseError as any, mockSourceMapService);

        // Assert
        expect(result).toBeInstanceOf(TestError);
    });

    test('should create a VMRuntimeError from a regular error', () => {
        // Arrange
        const originalError = new Error('Test error message');
        originalError.stack = 'Error: Test error message\n    at TestFunction';

        // Act
        const vmError = new VMRuntimeError(originalError, mockSourceMapService);

        // Assert
        expect(vmError.message).toBe('Test error message');
        expect(vmError.stack).toBe(originalError.stack);
        expect(originalError.name).toBe('VMRuntimeError');
    });

    test('should handle AggregateError instances correctly', () => {
        // Arrange
        const nestedError1 = new Error('Nested error 1');
        const nestedError2 = new Error('Nested error 2');
        const aggregateError = new AggregateError([ nestedError1, nestedError2 ], 'Multiple errors occurred');

        // Act
        const vmError = new VMRuntimeError(aggregateError as any, mockSourceMapService);

        // Assert
        expect(vmError.message).toBe('Multiple errors occurred');
        expect(vmError.errors).toHaveLength(2);
        expect(vmError.errors?.[0]).toBeInstanceOf(VMRuntimeError);
        expect(vmError.errors?.[1]).toBeInstanceOf(VMRuntimeError);
    });

    test('should use custom inspection with nested errors', () => {
        // Arrange
        const nestedError1 = new Error('Nested error 1');
        nestedError1.stack = 'Error: Nested error 1\n    at Function1';
        const nestedError2 = new Error('Nested error 2');
        nestedError2.stack = 'Error: Nested error 2\n    at Function2';
        const aggregateError = new AggregateError([ nestedError1, nestedError2 ], 'Multiple errors');

        // Act
        const vmError: any = new VMRuntimeError(aggregateError as any, mockSourceMapService);
        const inspectResult = vmError[Symbol.for('nodejs.util.inspect.custom')]();

        // Assert
        expect(inspectResult).toContain('VMRuntimeError Contains 2 nested errors');
        expect(inspectResult).toContain('Nested error 1');
        expect(inspectResult).toContain('Nested error 2');
    });

    test('should use formatted stack trace in custom inspection when available', () => {
        // Arrange
        const originalError = new Error('Test error');
        originalError.stack = 'Error: Test error\n    at TestFunction';

        // Act
        const vmError: any = new VMRuntimeError(originalError as any, mockSourceMapService);
        // Manually set formattedStack for testing
        (vmError as any).formattedStack = 'Formatted stack trace';
        const inspectResult = vmError[Symbol.for('nodejs.util.inspect.custom')]();

        // Assert
        expect(inspectResult).toBe('Formatted stack trace');
    });

    test('should call reformatStack method with correct parameters', () => {
        // Arrange
        const originalError = new Error('Test error');
        const reformatStackSpy = jest.spyOn(VMRuntimeError.prototype as any, 'reformatStack');

        // Act
        new VMRuntimeError(originalError as any, mockSourceMapService, true);

        // Assert
        expect(reformatStackSpy).toHaveBeenCalledWith(originalError, true);
    });
});
