/**
 * Import will remove at compile time
 */

import type { ErrorType } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { formatStack } from '@components/stack.component';

/**
 * Mock dependencies
 */

jest.mock('@components/stack.component', () => ({
    formatStack: jest.fn().mockReturnValue('formatted stack trace')
}));

/**
 * Create a concrete implementation of BaseError for testing
 */

class TestError extends BaseError {
    constructor(message: string, sourceMap?: any) {
        super('TestError', message, sourceMap);
    }

    testReformatStack(error: ErrorType & BaseError, xJetService = false): void {
        return this.reformatStack(error, xJetService);
    }

    // Add index signature to handle Symbol properties
    [key: symbol]: any;
}

/**
 * Test
 */


describe('BaseError', () => {
    let mockSourceMap: any;
    let testError: TestError;

    beforeEach(() => {
        mockSourceMap = { map: jest.fn() };
        testError = new TestError('Test error message', mockSourceMap);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with correct name and message', () => {
            expect(testError.name).toBe('TestError');
            expect(testError.message).toBe('Test error message');
        });

        test('should store source map service if provided', () => {
            expect(testError.sourceMap).toBe(mockSourceMap);
        });

        test('should have undefined source map when not provided', () => {
            const errorWithoutMap = new TestError('No map error');
            expect(errorWithoutMap.sourceMap).toBeUndefined();
        });
    });

    describe('getters', () => {
        test('should return the source map via getter', () => {
            expect(testError.sourceMap).toBe(mockSourceMap);
        });

        test('should return undefined for formatStack when not set', () => {
            expect(testError.formatStack).toBeUndefined();
        });

        test('should return the formatted stack after reformatStack is called', () => {
            const mockError = {
                name: 'TestError',
                message: 'Test error message'
            } as unknown as ErrorType & BaseError;

            testError.testReformatStack(mockError);
            expect(testError.formatStack).toBe('formatted stack trace');
        });
    });

    describe('custom inspection', () => {
        test('should return formatted stack when available', () => {
            const mockError = {
                name: 'TestError',
                message: 'Test error message'
            } as unknown as ErrorType & BaseError;

            testError.testReformatStack(mockError);
            expect(testError[Symbol.for('nodejs.util.inspect.custom')]()).toBe('formatted stack trace');
        });

        test('should fall back to native stack when formatted stack is unavailable', () => {
            // Create a new error with a stack but no formatted stack
            const errorWithStack = new TestError('Stack error');
            const originalStack = errorWithStack.stack;

            expect(errorWithStack[Symbol.for('nodejs.util.inspect.custom')]()).toBe(originalStack);
        });
    });

    describe('reformatStack', () => {
        test('should call formatStack with correct parameters', () => {
            const mockError = {
                name: 'TestError',
                message: 'Test error message'
            } as unknown as ErrorType & BaseError;

            testError.testReformatStack(mockError);
            expect(formatStack).toHaveBeenCalledWith(mockError, false);
        });

        test('should call formatStack with includeFramework=true when specified', () => {
            const mockError = {
                name: 'TestError',
                message: 'Test error message'
            } as unknown as ErrorType & BaseError;

            testError.testReformatStack(mockError, true);
            expect(formatStack).toHaveBeenCalledWith(mockError, true);
        });

        test('should store the result of formatStack', () => {
            const mockError = {
                name: 'TestError',
                message: 'Test error message'
            } as unknown as ErrorType & BaseError;

            testError.testReformatStack(mockError);
            expect(testError.formatStack).toBe('formatted stack trace');
        });
    });
});
