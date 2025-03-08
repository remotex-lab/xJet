/**
 * Import will remove at compile time
 */

import type { ErrorType } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { formatStacks } from '@components/stack.component';

/**
 * Mock dependencies
 */

jest.mock('@components/stack.component', () => ({
    formatStacks: jest.fn().mockReturnValue('formatted stack trace')
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
}

/**
 * Test
 */

describe('BaseError', () => {
    // Mock the CallSite objects for testing
    const mockCallSite1 = {
        getFileName: jest.fn().mockReturnValue('test-file.ts'),
        getLineNumber: jest.fn().mockReturnValue(42),
        getColumnNumber: jest.fn().mockReturnValue(10),
        getFunctionName: jest.fn().mockReturnValue('testFunction'),
        isNative: jest.fn().mockReturnValue(false),
        isConstructor: jest.fn().mockReturnValue(false),
        isEval: jest.fn().mockReturnValue(false),
        isToplevel: jest.fn().mockReturnValue(true),
        getEvalOrigin: jest.fn(),
        getThis: jest.fn(),
        getTypeName: jest.fn(),
        getFunction: jest.fn(),
        getMethodName: jest.fn(),
        toString: jest.fn().mockReturnValue('at testFunction (test-file.ts:42:10)')

    } as unknown as NodeJS.CallSite;

    const mockCallSite2 = {
        getFileName: jest.fn().mockReturnValue('another-file.ts'),
        getLineNumber: jest.fn().mockReturnValue(24),
        getColumnNumber: jest.fn().mockReturnValue(5),
        getFunctionName: jest.fn().mockReturnValue('anotherFunction'),
        isNative: jest.fn().mockReturnValue(false),
        isConstructor: jest.fn().mockReturnValue(false),
        isEval: jest.fn().mockReturnValue(false),
        isToplevel: jest.fn().mockReturnValue(true),
        getEvalOrigin: jest.fn(),
        getThis: jest.fn(),
        getTypeName: jest.fn(),
        getFunction: jest.fn(),
        getMethodName: jest.fn(),
        toString: jest.fn().mockReturnValue('at anotherFunction (another-file.ts:24:5)')
    } as unknown as NodeJS.CallSite;

    beforeAll(() => {
        // Save original Error.prepareStackTrace
        jest.spyOn(Error, 'prepareStackTrace');
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with the correct name and message', () => {
        const error = new TestError('Test message');
        expect(error.name).toBe('TestError');
        expect(error.message).toBe('Test message');
    });

    test('should store and retrieve callStacks', () => {
        const error = new TestError('Test message');
        const mockStacks = [ mockCallSite1, mockCallSite2 ];

        error.callStacks = mockStacks;

        expect(error.callStacks).toEqual(mockStacks);
        expect(error.callStacks.length).toBe(2);
    });

    test('should initialize with an optional sourceMap', () => {
        const mockSourceMap = { /* mock implementation */ } as any;
        const error = new TestError('Test message', mockSourceMap);

        expect(error.sourceMap).toBe(mockSourceMap);
    });

    test('should return undefined for formatStack if not set', () => {
        const error = new TestError('Test message');

        expect(error.formatStack).toBeUndefined();
    });

    test('should return the custom inspection value', () => {
        const error = new TestError('Test message');
        const customFormattedStack = 'Custom formatted stack';

        // Set a private property using type assertion (for testing purposes)
        (error as any).formattedStack = customFormattedStack;

        const inspectionResult = (error as any)[Symbol.for('nodejs.util.inspect.custom')]();
        expect(inspectionResult).toBe(customFormattedStack);
    });

    test('should return stack when formattedStack is not available in custom inspect', () => {
        const error = new TestError('Test message');
        const originalStack = error.stack;

        const inspectionResult = (error as any)[Symbol.for('nodejs.util.inspect.custom')]();
        expect(inspectionResult).toBe(originalStack);
    });

    test('should use Error.prepareStackTrace to capture call stacks', () => {
        // Create a mock error
        const mockError = new Error('Test');
        const mockStackTraces = [ mockCallSite1, mockCallSite2 ];

        // Get the modified Error.prepareStackTrace function
        const modifiedPrepareStackTrace: any = Error.prepareStackTrace;

        // Call it directly to test its behavior
        try {
            modifiedPrepareStackTrace(mockError, mockStackTraces);
        } catch {
            // The BaseError type assertion is applied inside the function
            expect((mockError as any).callStacks).toEqual(mockStackTraces);
        }
    });

    describe('reformatStack', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should not reformat stack when callStacks is undefined', () => {
            // Arrange
            const testError = new TestError('Test error message');
            const errorWithoutCallStacks = { name: 'Error' } as ErrorType & BaseError;

            // Act
            testError.testReformatStack(errorWithoutCallStacks);

            // Assert
            expect(formatStacks).not.toHaveBeenCalled();
        });

        test('should reformat stack using formatStacks when callStacks is available', () => {
            // Arrange
            const testError = new TestError('Test error message');
            const mockCallStacks = [{}] as Array<NodeJS.CallSite>;
            const errorWithCallStacks = {
                name: 'Error',
                callStacks: mockCallStacks
            } as ErrorType & BaseError;

            // Act
            testError.testReformatStack(errorWithCallStacks);

            // Assert
            expect(formatStacks).toHaveBeenCalledWith(errorWithCallStacks, mockCallStacks, false);
            expect((testError as any).formattedStack).toBe('formatted stack trace');
        });

        test('should pass xJetService flag to formatStacks when provided', () => {
            // Arrange
            const testError = new TestError('Test error message');
            const mockCallStacks = [{}] as Array<NodeJS.CallSite>;
            const errorWithCallStacks = {
                name: 'Error',
                callStacks: mockCallStacks
            } as ErrorType & BaseError;

            // Act
            testError.testReformatStack(errorWithCallStacks, true);

            // Assert
            expect(formatStacks).toHaveBeenCalledWith(errorWithCallStacks, mockCallStacks, true);
            expect((testError as any).formattedStack).toBe('formatted stack trace');
        });
    });

});
