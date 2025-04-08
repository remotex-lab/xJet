/**
 * Imports
 */

import { normalize } from 'path';
import * as colors from '@components/colors.component';
import { FrameworkProvider } from '@providers/framework.provider';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';
import {
    stackEntry,
    formatStack,
    formatErrorLine,
    buildSourceMapPath,
    highlightPositionCode,
    formatPositionErrorLine
} from '@components/stack.component';

/**
 * Mock dependencies
 */

jest.mock('@components/colors.component');
jest.mock('@providers/framework.provider');
jest.mock('@remotex-labs/xmap/parser.component');
jest.mock('@remotex-labs/xmap/formatter.component');
jest.mock('@remotex-labs/xmap/highlighter.component');

/**
 * Tests
 */

describe('highlightPositionCode', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should highlight code and format it with proper colors', () => {
        // Arrange
        const mockPosition = {
            name: 'test.ts',
            code: 'const x = 5;',
            line: 1,
            source: 'source',
            column: 8,
            endLine: 1,
            startLine: 1,
            sourceRoot: '/src',
            sourceIndex: 0,
            generatedLine: 1,
            generatedColumn: 0
        };

        const mockHighlightedCode = 'const x = 5;';
        const mockFormattedOutput = 'Formatted Error: const x = 5;';

        // Set up mock return values
        (highlightCode as jest.Mock).mockReturnValue(mockHighlightedCode);
        (formatErrorCode as jest.Mock).mockReturnValue(mockFormattedOutput);

        // Act
        const result = highlightPositionCode(mockPosition);

        // Assert
        expect(highlightCode).toHaveBeenCalledWith(mockPosition.code);
        expect(formatErrorCode).toHaveBeenCalledWith(
            { ...mockPosition, code: mockHighlightedCode },
            {
                color: colors.Colors.BrightPink,
                reset: colors.Colors.Reset
            }
        );
        expect(result).toBe(mockFormattedOutput);
    });

    test('should work with minimal position data', () => {
        // Arrange
        const mockMinimalPosition = {
            code: 'const y = 10;',
            line: 1,
            column: 1
            // Only include required properties from PositionWithCodeInterface
        };

        const mockHighlightedCode = 'const y = 10;';
        const mockFormattedOutput = 'Minimal formatted output';

        (highlightCode as jest.Mock).mockReturnValue(mockHighlightedCode);
        (formatErrorCode as jest.Mock).mockReturnValue(mockFormattedOutput);

        // Act
        const result = highlightPositionCode(mockMinimalPosition as any);

        // Assert
        expect(highlightCode).toHaveBeenCalledWith(mockMinimalPosition.code);
        expect(formatErrorCode).toHaveBeenCalledWith(
            { ...mockMinimalPosition, code: mockHighlightedCode },
            {
                color: colors.Colors.BrightPink,
                reset: colors.Colors.Reset
            }
        );
        expect(result).toBe(mockFormattedOutput);
    });
});

describe('formatErrorLine', () => {
    let setColorSpy: jest.SpyInstance;
    const mockFrameworkProvider = {
        getInstance: jest.fn().mockReturnValue({
            paths: {
                root: '/project/root'
            },
            getRootDirectory: jest.fn()
        })
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(FrameworkProvider, 'getInstance').mockReturnValue(<any> mockFrameworkProvider.getInstance());
        mockFrameworkProvider.getInstance().getRootDirectory.mockImplementation(
            () => '/project/root'
        );

        setColorSpy = jest.spyOn(colors, 'setColor').mockImplementation((color, text) => {
            return `[COLOR:90]${ text }[/COLOR]`;
        });
    });

    test('should format frame with complete information', () => {
        // Arrange
        const frame = {
            line: 42,
            column: 8,
            source: 'source code',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: 'processData',
            fileName: '/src/utils/data.ts'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe(
            'at processData [COLOR:90]/src/utils/data.ts[/COLOR] [COLOR:90][42:8][/COLOR]'
        );
        expect(setColorSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle frame without line and column', () => {
        // Arrange
        const frame = {
            source: 'source code',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: 'processData',
            fileName: '/src/utils/data.ts'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe('at processData [COLOR:90]/src/utils/data.ts[/COLOR]');
        expect(setColorSpy).toHaveBeenCalledTimes(1);
        expect(setColorSpy).toHaveBeenCalledWith(expect.anything(), frame.fileName);
    });

    test('should handle frame without fileName', () => {
        // Arrange
        const frame = {
            line: 42,
            column: 8,
            source: 'source code',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: 'processData'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe('source code');
        expect(setColorSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle frame with undefined source when fileName is missing', () => {
        // Arrange
        const frame: any = {
            line: 42,
            column: 8,
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: 'processData'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe('');
        expect(setColorSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle frame with undefined functionName', () => {
        // Arrange
        const frame: any = {
            line: 42,
            column: 8,
            source: 'source code',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            fileName: '/src/utils/data.ts'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe('at [COLOR:90]/src/utils/data.ts[/COLOR] [COLOR:90][42:8][/COLOR]');
        expect(setColorSpy).toHaveBeenCalledTimes(2);
    });

    test('should trim extra whitespace properly', () => {
        // Arrange
        const frame = {
            line: 42,
            column: 8,
            source: 'source code',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: '',  // Empty string causes extra spaces
            fileName: '/src/utils/data.ts'
        };

        // Act
        const result = formatErrorLine(frame);

        // Assert
        expect(result).toBe('at [COLOR:90]/src/utils/data.ts[/COLOR] [COLOR:90][42:8][/COLOR]');
        expect(setColorSpy).toHaveBeenCalledTimes(2);
    });
});

describe('buildSourceMapPath', () => {
    const mockFrameworkProvider = {
        getInstance: jest.fn().mockReturnValue({
            paths: {
                root: '/project/root'
            },
            getRootDirectory: jest.fn()
        })
    };

    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(FrameworkProvider, 'getInstance').mockReturnValue(<any> mockFrameworkProvider.getInstance());
        mockFrameworkProvider.getInstance().getRootDirectory.mockImplementation(
            () => '/project/root'
        );
    });

    test('should build source map path with sourceRoot', function() {
        // Arrange
        const context = {} as any; // Mock StackContextInterface

        const frame: any = {
            fileName: '/project/root/dist/file.js', // the bundle filename
            line: 10,
            column: 5
        };

        const position = {
            name: undefined,
            code: 'const x = 5;',
            line: 20,
            source: '../src/file.ts', // the source filename
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: '/project/testNewSource/', // sourcemap source root path
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position as any);

        // Assert
        expect(result).toBe('/project/testNewSource/src/file.ts#L20');
        expect(mockFrameworkProvider.getInstance().getRootDirectory)
            .toHaveBeenCalledWith('/project/root/dist/file.js');
    });

    test('should build source map path without sourceRoot', function() {
        // Arrange
        const context = {} as any; // Mock StackContextInterface

        const frame: any = {
            fileName: '/project/root/dist/file.js',
            line: 10,
            column: 5
        };

        const position = {
            name: 'file.ts',
            code: 'const x = 5;',
            line: 20,
            source: '../src/file.ts',
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: '',
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position as any);

        // Assert
        expect(mockFrameworkProvider.getInstance().getRootDirectory)
            .toHaveBeenCalledWith('/project/root/dist/file.js');
        // The expected path depends on path.join behavior which might be platform-specific
        // This test checks that the result contains the correct components
        expect(result).not.toContain(normalize('/project/root'));
        expect(result).toContain('file.ts');
    });

    test('should handle missing fileName in frame', function() {
        // Arrange
        const context = {} as any; // Mock StackContextInterface

        const frame: any = {
            // fileName is missing
            line: 10,
            column: 5
        };

        const position = {
            name: 'file.ts',
            code: 'const x = 5;',
            line: 20,
            source: 'file.ts',
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: '/project/src/',
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position as any);

        // Assert
        expect(result).toBe('/project/src/file.ts#L20');
        expect(mockFrameworkProvider.getInstance().getRootDirectory)
            .toHaveBeenCalledWith('');
    });

    test('should convert file:/// URLs to local paths', function() {
        // Arrange
        const context: any = {}; // Mock StackContextInterface

        const frame: any = {
            fileName: 'file:///project/root/dist/file.js',
            line: 10,
            column: 5,
            source: '',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: ''
        };

        const position: any = {
            name: 'file.ts',
            code: 'const x = 5;',
            line: 20,
            source: '../src/file.ts',
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: '/project/root/',
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position);

        // Assert
        expect(result).toBe('/project/root/src/file.ts#L20');
        expect(mockFrameworkProvider.getInstance().getRootDirectory)
            .toHaveBeenCalledWith('/project/root/dist/file.js');
    });

    test('should properly handle Windows-style paths in sourceRoot', function() {
        // Arrange
        const context = {} as any; // Mock StackContextInterface

        const frame: any = {
            fileName: '/project/root/dist/file.js',
            line: 10,
            column: 5
        };

        const position = {
            name: 'file.ts',
            code: 'const x = 5;',
            line: 20,
            source: 'file.ts',
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: 'C:\\project\\src\\',
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position as any);

        // Assert
        expect(result).toBe('C:/project/src/dist/file.ts#L20');
        expect(mockFrameworkProvider.getInstance().getRootDirectory)
            .toHaveBeenCalledWith('/project/root/dist/file.js');
    });

    test('should handle HTTP/HTTPS URLs in position source', function() {
        // Arrange
        const context = {} as any; // Mock StackContextInterface

        const frame = {
            fileName: '/project/dist/file.js',
            line: 10,
            column: 5,
            source: '',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            functionName: ''
        };

        const position = {
            name: 'file.ts',
            code: 'const x = 5;',
            line: 20,
            source: 'https://example.com/src/file.ts',
            column: 8,
            endLine: 20,
            startLine: 20,
            sourceRoot: '/project/root/',
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = buildSourceMapPath.call(context, frame, position as any);

        // Assert
        expect(result).toBe('https://example.com/src/file.ts#L20');
        expect(mockFrameworkProvider.getInstance().getRootDirectory).not.toHaveBeenCalled();

    });
});

describe('formatPositionErrorLine', () => {
    let setColorSpy: jest.SpyInstance;
    let mockContext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        setColorSpy = jest.spyOn(colors, 'setColor').mockImplementation((color, text) => {
            return `[COLOR:${color}]${text}[/COLOR]`;
        });

        // Mock the FrameworkProvider used by buildSourceMapPath
        (FrameworkProvider.getInstance as jest.Mock).mockReturnValue({
            paths: {
                rootDirectory: '/project'
            },
            getRootDirectory: jest.fn().mockReturnValue('/project')
        });

        mockContext = {
            error: {
                name: 'TypeError',
                message: 'undefined is not a function'
            },
            code: '',
            activeNative: false,
            includeFramework: false
        };
    });

    test('should format error line with source map position information', () => {
        // Arrange
        const frame: any = {
            line: 42,
            column: 12,
            source: '',
            eval: false,
            async: false,
            native: false,
            constructor: false,
            fileName: '/dist/app.js',
            functionName: 'processData'
        };

        const position: any = {
            source: 'app.ts',
            line: 36,
            column: 8,
            code: 'user.process()',
            name: 'User.process',
            sourceRoot: '/src/',
            endLine: 36,
            startLine: 36,
            sourceIndex: 0,
            generatedLine: 42,
            generatedColumn: 12
        };

        setColorSpy.mockReturnValue('/project');
        const result = formatPositionErrorLine(mockContext, frame, position);

        // Assert
        expect(mockContext.error.message).toBe('User.process is not a function');
        expect(mockContext.code).not.toBe('');
        expect(highlightCode).toHaveBeenCalledWith(position.code);
        expect(formatErrorCode).toHaveBeenCalled();
        expect(result).toMatch(/at User\.process/);
        // Since we don't mock buildSourceMapPath, check for expected path structure
        expect(result).toContain('/project');
    });

    test('should not update TypeError message if position has no name', () => {
        // Arrange
        const originalMessage = 'undefined is not a function';
        mockContext.error.message = originalMessage;

        const frame: any = {
            line: 10,
            column: 5,
            fileName: '/dist/app.js',
            functionName: 'process'
        };

        const position: any = {
            source: 'app.ts',
            line: 8,
            column: 3,
            code: 'doSomething()',
            // No name property
            sourceRoot: '/src/',
            endLine: 8,
            startLine: 8,
            sourceIndex: 0,
            generatedLine: 10,
            generatedColumn: 5
        };

        // Act
        const result = formatPositionErrorLine(mockContext, frame, position);

        // Assert
        expect(mockContext.error.message).toBe(originalMessage); // Message shouldn't change
        expect(mockContext.code).not.toBe('');
        expect(result).toMatch(/at process/); // Should use frame's functionName
    });

    test('should not set context.code if it already exists', () => {
        // Arrange
        const existingCode = 'existing highlighted code';
        mockContext.code = existingCode;

        const frame: any = {
            line: 15,
            column: 8,
            fileName: '/dist/app.js',
            functionName: 'test'
        };

        const position: any = {
            source: 'app.ts',
            line: 12,
            column: 5,
            code: 'testFunction()',
            name: 'testFunction',
            sourceRoot: '/src/',
            endLine: 12,
            startLine: 12,
            sourceIndex: 0,
            generatedLine: 15,
            generatedColumn: 8
        };

        // Act
        formatPositionErrorLine(mockContext, frame, position);

        // Assert
        expect(highlightCode).not.toHaveBeenCalled();
        expect(mockContext.code).toBe(existingCode); // Code should remain unchanged
    });

    test('should use position.name if available, otherwise fallback to frame.functionName', () => {
        // Arrange
        const frame: any = {
            line: 20,
            column: 10,
            fileName: '/dist/app.js',
            functionName: 'fallbackName'
        };

        const position: any = {
            source: 'app.ts',
            line: 18,
            column: 7,
            code: 'testCode()',
            name: 'primaryName',
            sourceRoot: '/src/',
            endLine: 18,
            startLine: 18,
            sourceIndex: 0,
            generatedLine: 20,
            generatedColumn: 10
        };

        // Act
        const result = formatPositionErrorLine(mockContext, frame, position);

        // Assert
        expect(result).toMatch(/at primaryName/); // Should use position.name

        // Now test with no position.name
        const positionWithoutName = { ...position };
        delete positionWithoutName.name;
        const result2 = formatPositionErrorLine(mockContext, frame, positionWithoutName);

        expect(result2).toMatch(/at fallbackName/); // Should fall back to frame.functionName
    });
});

describe('stackEntry', () => {
    let mockFrameworkProvider: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(colors, 'setColor').mockImplementation((color, text) => {
            return `[COLOR:${color}]${text}[/COLOR]`;
        });

        // Create a mock framework provider
        mockFrameworkProvider = {
            isSharedSourceFile: jest.fn(),
            isFrameworkSourceFile: jest.fn(),
            getFrameworkSourceMap: jest.fn(),
            paths: {
                rootDirectory: '/project'
            },
            getRootDirectory: jest.fn().mockReturnValue('/project')
        };

        (FrameworkProvider.getInstance as jest.Mock).mockReturnValue(mockFrameworkProvider);

        // Set up highlightCode and formatErrorCode mocks
        (highlightCode as jest.Mock).mockImplementation((code) => `highlighted:${code}`);
        (formatErrorCode as jest.Mock).mockImplementation((position, options) =>
            `formatted:${position.code}:${options.color}`);
    });

    test('should return empty string for native frames when activeNative is false', () => {
        // Arrange
        const mockContext: any = {
            error: { name: 'Error', message: 'Something went wrong' },
            code: '',
            activeNative: false,
            includeFramework: true
        };

        const mockFrame: any = {
            line: 10,
            column: 5,
            fileName: 'node:internal/process/task_queues',
            functionName: 'process._tickCallback'
        };

        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(false);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(result).toBe('');
        expect(mockFrameworkProvider.isFrameworkSourceFile).toHaveBeenCalledWith(
            normalize('node:internal/process/task_queues')
        );
    });

    test('should return empty string for framework files when includeFramework is false', () => {
        // Arrange
        const mockContext: any = {
            error: { name: 'Error', message: 'Something went wrong' },
            code: '',
            activeNative: true,
            includeFramework: false
        };

        const mockFrame: any = {
            line: 15,
            column: 8,
            fileName: '/project/node_modules/@remotex-labs/xmap/index.js',
            functionName: 'parseError'
        };

        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(true);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(result).toBe('');
        expect(mockFrameworkProvider.isFrameworkSourceFile).toHaveBeenCalledWith(
            normalize('/project/node_modules/@remotex-labs/xmap/index.js')
        );
    });

    test('should use framework source map for framework files', () => {
        // Arrange
        const mockContext: any = {
            error: {
                name: 'TypeError',
                message: 'undefined is not a function',
                sourceMap: null
            },
            code: '',
            activeNative: true,
            includeFramework: true
        };

        const mockFrame: any = {
            line: 25,
            column: 12,
            fileName: '/project/node_modules/@remotex-labs/xmap/index.js',
            functionName: 'parseMap'
        };

        const mockPosition = {
            source: 'index.ts',
            line: 20,
            column: 8,
            code: 'map.parse()',
            name: 'Map.parse',
            sourceRoot: '/src/',
            endLine: 20,
            startLine: 20,
            sourceIndex: 0,
            generatedLine: 25,
            generatedColumn: 12
        };

        mockFrameworkProvider.isSharedSourceFile.mockReturnValue(false);
        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(true);
        const mockSourceMap = {
            getPositionWithCode: jest.fn().mockReturnValue(mockPosition)
        };

        mockFrameworkProvider.getFrameworkSourceMap.mockReturnValue(mockSourceMap);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(mockFrameworkProvider.getFrameworkSourceMap).toHaveBeenCalledWith(
            normalize('/project/node_modules/@remotex-labs/xmap/index.js')
        );

        expect(mockSourceMap.getPositionWithCode).toHaveBeenCalledWith(25, 12, 0, undefined);
        expect(result).toContain('Map.parse');
        expect(mockContext.error.message).toBe('Map.parse is not a function');
        expect(highlightCode).toHaveBeenCalledWith(mockPosition.code);
        expect(formatErrorCode).toHaveBeenCalled();
    });

    test('should use error source map for non-framework files', () => {
        // Arrange
        const mockContext: any = {
            error: {
                name: 'ReferenceError',
                message: 'variable is not defined',
                sourceMap: {
                    getPositionWithCode: jest.fn()
                }
            },
            code: '',
            activeNative: true,
            includeFramework: true
        };

        const mockFrame: any = {
            line: 30,
            column: 15,
            fileName: '/project/dist/app.js',
            functionName: 'getData'
        };

        const mockPosition = {
            source: 'app.ts',
            line: 24,
            column: 10,
            code: 'config.getData()',
            name: 'Config.getData',
            sourceRoot: '/src/',
            endLine: 24,
            startLine: 24,
            sourceIndex: 0,
            generatedLine: 30,
            generatedColumn: 15
        };

        mockFrameworkProvider.isSharedSourceFile.mockReturnValue(false);
        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(false);
        mockContext.error.sourceMap.getPositionWithCode.mockReturnValue(mockPosition);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(mockFrameworkProvider.isFrameworkSourceFile).toHaveBeenCalledWith(
            normalize('/project/dist/app.js')
        );
        expect(mockContext.error.sourceMap.getPositionWithCode).toHaveBeenCalledWith(30, 15, 0, undefined);
        expect(result).toContain('Config.getData');
        expect(highlightCode).toHaveBeenCalledWith(mockPosition.code);
        expect(formatErrorCode).toHaveBeenCalled();
    });

    test('should return empty string for eval machine with no function name', () => {
        // Arrange
        const mockContext: any = {
            error: {
                name: 'Error',
                message: 'Eval error',
                sourceMap: null
            },
            code: '',
            activeNative: true,
            includeFramework: true
        };

        const mockFrame: any = {
            line: 1,
            column: 1,
            fileName: 'evalmachine.<anonymous>',
            functionName: ''
        };

        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(false);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(result).toBe('');
    });

    test('should use formatErrorLine when no source map position is available', () => {
        // Arrange
        const mockContext: any = {
            error: {
                name: 'Error',
                message: 'Generic error',
                sourceMap: {
                    getPositionWithCode: jest.fn().mockReturnValue(null)
                }
            },
            code: '',
            activeNative: true,
            includeFramework: true
        };

        const mockFrame: any = {
            line: 42,
            column: 8,
            fileName: '/project/src/utils.js',
            functionName: 'formatData'
        };

        mockFrameworkProvider.isFrameworkSourceFile.mockReturnValue(false);

        // Act
        const result = stackEntry(mockContext, mockFrame);

        // Assert
        expect(mockContext.error.sourceMap.getPositionWithCode).toHaveBeenCalledWith(42, 8, 0, undefined);
        expect(result).toContain('at formatData');
        expect(result).toContain(
            normalize('/project/src/utils.js')
        );
    });
});

describe('formatStack', () => {
    let setColorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Spy on setColor
        setColorSpy = jest.spyOn(colors, 'setColor').mockImplementation((color, text) => {
            return `[COLOR:${color}]${text}[/COLOR]`;
        });
    });

    test('should format error with stack trace', () => {
        // Arrange
        const mockError = new Error('Test error message');

        const mockFrames = [
            {
                line: 10,
                column: 5,
                fileName: '/src/app.js',
                functionName: 'testFunction',
                source: 'source code'
            },
            {
                line: 20,
                column: 15,
                fileName: '/src/utils.js',
                functionName: 'helperFunction',
                source: 'helper source'
            }
        ];

        const mockParsedStack = {
            message: 'Test error message',
            name: 'Error',
            stack: mockFrames
        };

        (parseErrorStack as jest.Mock).mockReturnValue(mockParsedStack);

        // Act
        const result = formatStack(mockError, false, false);

        // Assert
        expect(parseErrorStack).toHaveBeenCalledWith(mockError);
        expect(result).toContain('\nError: \n');
        expect(result).toContain('Test error message');
        expect(result).toContain('Enhanced Stack Trace:');
    });

    test('should format error with includeFramework and activeNative flags', () => {
        // Arrange
        const mockError = new TypeError('Cannot read property of undefined');

        const mockFrames = [
            {
                line: 42,
                column: 8,
                fileName: '/src/main.js',
                functionName: 'processData',
                source: 'const result = data.property.value;'
            }
        ];

        const mockParsedStack = {
            message: 'Cannot read property of undefined',
            name: 'TypeError',
            stack: mockFrames
        };

        (parseErrorStack as jest.Mock).mockReturnValue(mockParsedStack);

        // Act
        const result = formatStack(mockError, true, true);

        // Assert
        expect(parseErrorStack).toHaveBeenCalledWith(mockError);
        expect(result).toContain('\nTypeError: \n');
        expect(result).toContain('Cannot read property of undefined');
        expect(result).toContain('Enhanced Stack Trace:');
    });

    test('should handle errors with empty stack traces', () => {
        // Arrange
        const mockError = new Error('Error with no stack');

        const mockParsedStack = {
            message: 'Error with no stack',
            name: 'Error',
            stack: []
        };

        (parseErrorStack as jest.Mock).mockReturnValue(mockParsedStack);

        // Act
        const result = formatStack(mockError);

        // Assert
        expect(parseErrorStack).toHaveBeenCalledWith(mockError);
        expect(result).toContain('\nError: \n');
        expect(result).toContain('Error with no stack');
        expect(result).not.toContain('Enhanced Stack Trace:');
    });

    test('should apply color formatting to error message', () => {
        // Arrange
        const mockError = new Error('Formatted error message');

        const mockFrames = [
            {
                line: 5,
                column: 10,
                fileName: '/src/index.js',
                functionName: 'main',
                source: 'source code'
            }
        ];

        const mockParsedStack = {
            message: 'Formatted error message',
            name: 'Error',
            stack: mockFrames
        };

        (parseErrorStack as jest.Mock).mockReturnValue(mockParsedStack);

        // Act
        const result = formatStack(mockError);

        // Assert
        expect(setColorSpy).toHaveBeenCalledWith(colors.Colors.LightCoral, 'Formatted error message');
        expect(result).toContain('[COLOR:');
        expect(result).toContain('Formatted error message');
    });
});
