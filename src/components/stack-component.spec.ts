/**
 * Imports
 */

import { join, relative } from 'path';
import { setColor } from '@components/colors.component';
import { formatErrorCode, highlightCode } from '@remotex-labs/xmap';
import { FrameworkComponent } from '@components/framework.component';
import {
    formatStacks,
    formatErrorLine,
    buildSourceMapPath,
    highlightPositionCode,
    extractEnhancedFrameDetails
} from '@components/stack.component';

/**
 * Mock dependencies
 */

jest.mock('path');
jest.mock('@remotex-labs/xmap');
jest.mock('@components/colors.component');
jest.mock('@components/framework.component');

/**
 * Tests
 */

beforeEach(() => {
    jest.clearAllMocks();
});

describe('buildSourceMapPath', () => {
    test('should build source map path with sourceRoot', function() {
        const mockContext = {
            framework: {
                paths: { root: '/root' },
                getRootDirectory: jest.fn().mockReturnValue('/root')
            }
        };

        const mockFrame = {
            getFileName: jest.fn().mockReturnValue('file:///path/to/file.js')
        };

        const mockPosition = {
            source: 'original.ts',
            sourceRoot: '/src/',
            line: 42
        };

        (join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (relative as jest.Mock).mockReturnValue('relative/path');

        const result = buildSourceMapPath.call(
            mockContext as any,
            mockFrame as any,
            mockPosition as any
        );

        expect(result).toBe('/src/relative/path#L42');
    });
});

describe('extractEnhancedFrameDetails', () => {
    test('should extract details from a frame', () => {
        const mockFrame = {
            getTypeName: jest.fn().mockReturnValue('TestClass'),
            getFunctionName: jest.fn().mockReturnValue('testMethod'),
            getLineNumber: jest.fn().mockReturnValue(42),
            getColumnNumber: jest.fn().mockReturnValue(10),
            getFileName: jest.fn().mockReturnValue('test.ts'),
            isNative: jest.fn().mockReturnValue(false)
        };

        const result = extractEnhancedFrameDetails(mockFrame as any);

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
        const mockFrame = {
            isPromiseAll: jest.fn().mockReturnValue(true),
            getPromiseIndex: jest.fn().mockReturnValue(0)
        };

        const mockEnhancedFrame = {
            line: 1,
            column: 1,
            source: 'test.ts',
            name: 'test'
        };

        const result = formatErrorLine(mockFrame as any, mockEnhancedFrame);
        expect(result).toBe('at async Promise.all (index: 0)');
    });

    test('should format regular frames', () => {
        const mockFrame = {
            isPromiseAll: jest.fn().mockReturnValue(false),
            isAsync: jest.fn().mockReturnValue(false)
        };

        const mockEnhancedFrame = {
            line: 42,
            column: 10,
            source: 'test.ts',
            name: 'testFunction'
        };

        const result = formatErrorLine(mockFrame as any, mockEnhancedFrame);
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
        (FrameworkComponent.getInstance as jest.Mock).mockReturnValue({
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
});
