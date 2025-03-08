/**
 * Imports
 */

import { join, relative } from 'path';
import { setColor } from '@components/colors.component';
import { FrameworkProvider } from '@providers/framework.provider';
import { formatErrorCode, highlightCode, type PositionWithCodeInterface } from '@remotex-labs/xmap';
import {
    stackEntry,
    formatStacks,
    formatErrorLine,
    buildSourceMapPath,
    highlightPositionCode,
    formatPositionErrorLine,
    extractEnhancedFrameDetails
} from '@components/stack.component';

/**
 * Mock dependencies
 */

jest.mock('path');
jest.mock('@remotex-labs/xmap');
jest.mock('@components/colors.component');
jest.mock('@providers/framework.provider');
jest.mock('@components/stack.component', () => {
    const originalModule = jest.requireActual('@components/stack.component');

    return {
        ...originalModule,
        formatErrorLine: jest.fn(originalModule.formatErrorLine),
        highlightPositionCode: jest.fn(originalModule.highlightPositionCode)
    };
});

/**
 * Tests
 */

let mockFrame: any;
beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockFrame = <any> {
        isAsync: jest.fn().mockReturnValue(false),
        isNative: jest.fn().mockReturnValue(false),
        getTypeName: jest.fn().mockReturnValue(''),
        getFileName: jest.fn().mockReturnValue('test.ts'),
        isPromiseAll: jest.fn().mockReturnValue(false),
        getLineNumber: jest.fn().mockReturnValue(10),
        getColumnNumber: jest.fn().mockReturnValue(5),
        getFunctionName: jest.fn().mockReturnValue('testFunction'),
        getPromiseIndex: jest.fn().mockReturnValue(0)
    };
});

describe('buildSourceMapPath', () => {
    test('should build source map path with sourceRoot', function() {
        const mockContext = {
            framework: {
                paths: { root: '/root' },
                getRootDirectory: jest.fn().mockReturnValue('/root')
            }
        };

        mockFrame.getFileName.mockReturnValue('file:///path/to/file.js');
        const mockPosition = {
            source: 'original.ts',
            sourceRoot: '/src/',
            line: 42
        };

        (join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (relative as jest.Mock).mockReturnValue('relative/path');

        const result = buildSourceMapPath.call(
            mockContext as any,
            mockFrame,
            mockPosition as any
        );

        expect(result).toBe('/src/relative/path#L42');
    });

    test('should build source map path without sourceRoot', function() {
        const mockContext = {
            framework: {
                paths: { root: '/root' },
                getRootDirectory: jest.fn().mockReturnValue('/root')
            }
        };

        mockFrame.getFileName.mockReturnValue('file:///path/to/file.js');
        const mockPosition = {
            source: 'original.ts',
            line: 42
            // No sourceRoot provided
        };

        (join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (relative as jest.Mock).mockReturnValue('relative/path');

        const result = buildSourceMapPath.call(
            mockContext as any,
            mockFrame,
            mockPosition as any
        );

        expect(join).toHaveBeenCalledWith('/root', 'relative/path');
        expect(result).toBe('/root/relative/path');
    });

});

describe('extractEnhancedFrameDetails', () => {
    test('should extract details from a frame', () => {
        mockFrame.isNative.mockReturnValue(false);
        mockFrame.getFileName.mockReturnValue('test.ts');
        mockFrame.getTypeName.mockReturnValue('TestClass');
        mockFrame.getFunctionName.mockReturnValue('testMethod');
        mockFrame.getLineNumber.mockReturnValue(42);
        mockFrame.getColumnNumber.mockReturnValue(10);
        const result = extractEnhancedFrameDetails(mockFrame);

        expect(result).toEqual({
            line: 42,
            column: 10,
            source: 'test.ts',
            name: 'TestClass.testMethod'
        });
    });
});

describe('formatErrorLine', () => {
    beforeEach(() => {
        (setColor as jest.Mock).mockImplementation((_, text) => text);
    });

    test('should format Promise.all frames', () => {
        mockFrame.isPromiseAll.mockReturnValue(true);
        mockFrame.getPromiseIndex.mockReturnValue(0);
        const mockEnhancedFrame = {
            line: 1,
            column: 1,
            source: 'test.ts',
            name: 'test'
        };

        const result = formatErrorLine(mockFrame, mockEnhancedFrame);
        expect(result).toBe('at async Promise.all (index: 0)');
    });

    test('should format regular frames', () => {
        mockFrame.isAsync.mockReturnValue(false);
        mockFrame.isPromiseAll.mockReturnValue(false);

        const mockEnhancedFrame = {
            line: 42,
            column: 10,
            source: 'test.ts',
            name: 'testFunction'
        };

        const result = formatErrorLine(mockFrame, mockEnhancedFrame);
        expect(result).toContain('at testFunction');
        expect(result).toContain('test.ts');
        expect(result).toContain('[42:10]');
    });
});

describe('highlightPositionCode', () => {
    test('should highlight code with proper formatting', () => {
        const mockPosition = {
            code: 'const x = 1;',
            line: 1,
            column: 1
        };

        (highlightCode as jest.Mock).mockReturnValue('highlighted code');
        (formatErrorCode as jest.Mock).mockReturnValue('formatted highlighted code');

        const result = highlightPositionCode(<any> mockPosition);

        expect(result).toBe('formatted highlighted code');
        expect(highlightCode).toHaveBeenCalledWith('const x = 1;');
        expect(formatErrorCode).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 'highlighted code'
            }),
            expect.any(Object)
        );
    });
});

describe('formatStacks', () => {
    beforeEach(() => {
        (FrameworkProvider.getInstance as jest.Mock).mockReturnValue({
            isFrameworkSourceFile: jest.fn().mockReturnValue(false)
        });
        (setColor as jest.Mock).mockImplementation((_, text) => text);
    });

    test('should format error stack trace', () => {
        const mockError = {
            name: 'TestError',
            message: 'Test message'
        };

        const mockFrames = [{
            getFileName: jest.fn().mockReturnValue('test.ts'),
            isPromiseAll: jest.fn().mockReturnValue(false),
            isAsync: jest.fn().mockReturnValue(false),
            getTypeName: jest.fn().mockReturnValue(''),
            getFunctionName: jest.fn().mockReturnValue('testFn'),
            getLineNumber: jest.fn().mockReturnValue(42),
            getColumnNumber: jest.fn().mockReturnValue(10),
            isNative: jest.fn().mockReturnValue(false)
        }];

        const result = formatStacks(mockError as any, mockFrames as any);

        expect(result).toContain('TestError');
        expect(result).toContain('Test message');
        expect(result).toContain('Enhanced Stack Trace');
    });

    test('should include code in formatted error when context has code', () => {
        const mockError = {
            name: 'TestError',
            message: 'Test message'
        };

        const mockFrames = [{
            getFileName: jest.fn().mockReturnValue('test.ts'),
            isPromiseAll: jest.fn().mockReturnValue(false),
            isAsync: jest.fn().mockReturnValue(false),
            getTypeName: jest.fn().mockReturnValue(''),
            getFunctionName: jest.fn().mockReturnValue('testFn'),
            getLineNumber: jest.fn().mockReturnValue(42),
            getColumnNumber: jest.fn().mockReturnValue(10),
            isNative: jest.fn().mockReturnValue(false)
        }];

        const result = formatStacks(mockError as any, mockFrames as any);

        expect(result).toContain('TestError');
        expect(result).toContain('Test message');
        expect(result).toContain('Enhanced Stack Trace');
    });
});

describe('stackEntry', () => {
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            activeNative: false,
            activexJetService: false,
            framework: {
                sourceMap: {
                    getPositionWithCode: jest.fn()
                },
                getRootDirectory: jest.fn(),
                isFrameworkSourceFile: jest.fn()
            },
            error: new Error('Test error')
        };

        mockFrame = {
            isAsync: jest.fn().mockReturnValue(false),
            isNative: jest.fn().mockReturnValue(false),
            getTypeName: jest.fn().mockReturnValue(''),
            getFileName: jest.fn().mockReturnValue('test.ts'),
            isPromiseAll: jest.fn().mockReturnValue(false),
            getLineNumber: jest.fn().mockReturnValue(10),
            getColumnNumber: jest.fn().mockReturnValue(5),
            getFunctionName: jest.fn().mockReturnValue('testFunction')
        };
    });

    test('should return empty string for native frames when activeNative is false', () => {
        mockFrame.isNative.mockReturnValue(true);
        mockFrame.getTypeName.mockReturnValue('test');
        mockFrame.getFileName.mockReturnValue('node:test');
        const result = stackEntry.call(mockContext, mockFrame);

        expect(result).toBe('');
    });

    test('should return empty string for xJet service files when activexJetService is false', () => {
        mockContext.framework.isFrameworkSourceFile.mockReturnValue(true);
        const result = stackEntry.call(mockContext, mockFrame);

        expect(result).toBe('');
    });

    test('should NOT return empty string when filename is eval but function name exists', () => {
        // Arrange
        mockFrame.getFileName.mockReturnValue('<eval>');
        mockFrame.getFunctionName.mockReturnValue('someFunction');
        mockFrame.getLineNumber.mockReturnValue(1);
        mockFrame.getColumnNumber.mockReturnValue(1);

        // Act
        const result = stackEntry.call(mockContext, mockFrame);

        // Assert
        expect(result).not.toBe('');
        expect(mockFrame.getFileName).toHaveBeenCalled();
        expect(mockFrame.getFunctionName).toHaveBeenCalled();
    });

    test('should NOT return empty string when filename is not eval', () => {
        // Arrange
        mockFrame.getFileName.mockReturnValue('some-file.js');
        mockFrame.getFunctionName.mockReturnValue('');
        mockFrame.getLineNumber.mockReturnValue(1);
        mockFrame.getColumnNumber.mockReturnValue(1);

        // Act
        const result = stackEntry.call(mockContext, mockFrame);

        // Assert
        expect(result).not.toBe('');
        expect(mockFrame.getFileName).toHaveBeenCalled();
        expect(mockFrame.getFunctionName).toHaveBeenCalled();
    });

});

describe('formatPositionErrorLine', () => {
    let mockContext: any;
    let mockPosition: Required<PositionWithCodeInterface>;

    beforeEach(() => {
        mockContext = {
            error: {
                name: 'TypeError',
                message: 'Original TypeError message'
            },
            code: '',
            framework: {
                paths: { root: '/root' },
                getRootDirectory: jest.fn().mockReturnValue('/root')
            }
        };

        mockPosition = <any> {
            name: 'CustomError',
            line: 42,
            column: 10,
            source: 'original.ts',
            sourceRoot: '/src/',
            code: 'const x = undefined;'
        };
    });

    test('should update TypeError message when position name is provided', () => {
        const result = formatPositionErrorLine.call(
            mockContext,
            mockFrame,
            mockPosition
        );

        expect(mockContext.error.message).toBe('CustomError TypeError message');
        expect(result).toBe('at CustomError /src/relative/path#L42 [42:10]');
    });

    test('should not update error message for non-TypeError errors', () => {
        mockContext.error.name = 'ReferenceError';
        const originalMessage = mockContext.error.message;

        formatPositionErrorLine.call(
            mockContext,
            mockFrame,
            mockPosition
        );

        expect(mockContext.error.message).toBe(originalMessage);
    });

    test('should set context code if it is not already set', () => {
        mockContext.error.name = 'test';
        (formatErrorCode as jest.Mock).mockReturnValue('highlighted code');

        formatPositionErrorLine.call(
            mockContext,
            mockFrame,
            mockPosition
        );

        expect(mockContext.code).toBe('highlighted code');
    });

    test('should not update context code if it is already set', () => {
        mockContext.code = 'existing code';

        formatPositionErrorLine.call(
            mockContext,
            mockFrame,
            mockPosition
        );

        expect(highlightPositionCode).not.toHaveBeenCalled();
        expect(mockContext.code).toBe('existing code');
    });
});
