/**
 * Imports
 */

import { esBuildError } from '@errors/esbuild.error';
import { Colors, setColor } from '@components/colors.component';
import { formatCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

/**
 * Mock dependencies
 */

jest.mock('@components/colors.component', () => ({
    Colors: {
        LightCoral: 'lightCoral',
        DarkGray: 'darkGray',
        Gray: 'gray'
    },
    setColor: jest.fn((color, text) => `[${ color }]${ text }[/${ color }]`)
}));

jest.mock('@remotex-labs/xmap/formatter.component', () => ({
    formatCode: jest.fn(code => `formatted(${ code })`)
}));

jest.mock('@remotex-labs/xmap/highlighter.component', () => ({
    highlightCode: jest.fn(code => `highlighted(${ code })`)
}));

/**
 * Tests
 */

describe('esBuildError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create an instance with correct name and message', () => {
        const error = new esBuildError(<any>{ aggregateErrors: [] });
        expect(error.name).toBe('ESBuildError');
        expect(error.message).toBe('esBuildError build failed');
    });

    test('should format errors correctly when aggregateErrors present', () => {
        const mockErrorObj = <any>{
            aggregateErrors: [
                {
                    id: 'error-1',
                    text: 'Test error',
                    notes: [{ text: 'Error note' }],
                    location: {
                        file: 'test.ts',
                        line: 10,
                        column: 5,
                        lineText: 'const x = invalid;'
                    },
                    pluginName: 'esbuild'
                }
            ]
        };

        const error = new esBuildError(mockErrorObj);

        // Verify color formatting calls
        expect(setColor).toHaveBeenCalledWith(
            Colors.LightCoral,
            'Test error: Error note'
        );
        expect(setColor).toHaveBeenCalledWith(
            Colors.DarkGray,
            'test.ts'
        );
        expect(setColor).toHaveBeenCalledWith(
            Colors.Gray,
            '[10:5]'
        );

        // Verify code formatting calls
        expect(highlightCode).toHaveBeenCalledWith('const x = invalid;');
        expect(formatCode).toHaveBeenCalledWith(
            'highlighted(const x = invalid;)',
            { startLine: 10 }
        );

        // Verify the formatted stack contains all necessary parts
        expect((<any>error).formattedStack).toContain('ESBuildError');
        expect((<any>error).formattedStack).toContain('formatted(highlighted(const x = invalid;))');
    });

    test('should handle multiple errors in aggregateErrors', () => {
        const mockErrorObj = <any>{
            aggregateErrors: [
                {
                    id: 'error-1',
                    text: 'First error',
                    notes: [{ text: 'First note' }],
                    location: {
                        file: 'first.ts',
                        line: 1,
                        column: 1,
                        lineText: 'const a = 1;'
                    },
                    pluginName: 'esbuild'
                },
                {
                    id: 'error-2',
                    text: 'Second error',
                    notes: [{ text: 'Second note' }],
                    location: {
                        file: 'second.ts',
                        line: 2,
                        column: 2,
                        lineText: 'const b = 2;'
                    },
                    pluginName: 'esbuild'
                }
            ]
        };

        const error = new esBuildError(mockErrorObj);

        // Verify multiple errors are formatted
        expect(setColor).toHaveBeenCalledTimes(6); // 2 errors × 3 color calls each
        expect(highlightCode).toHaveBeenCalledTimes(2);
        expect(formatCode).toHaveBeenCalledTimes(2);

        // Verify both errors are in the stack
        expect((<any>error).formattedStack).toContain('First error');
        expect((<any>error).formattedStack).toContain('Second error');
    });

    test('should handle errors without notes in aggregateErrors', () => {
        const mockErrorObj = <any>{
            aggregateErrors: [
                {
                    id: 'error-1',
                    text: 'Test error',
                    notes: [],
                    location: {
                        file: 'test.ts',
                        line: 1,
                        column: 1,
                        lineText: 'const x = 1;'
                    },
                    pluginName: 'esbuild'
                }
            ]
        };

        const error = new esBuildError(mockErrorObj);

        expect((<any>error).formattedStack).toContain('Test error');
        expect(setColor).toHaveBeenCalledWith(
            Colors.LightCoral,
            'Test error: undefined'
        );
    });

    test('should trim line text in formatting', () => {
        const mockErrorObj = <any>{
            aggregateErrors: [
                {
                    id: 'error-1',
                    text: 'Test error',
                    notes: [{ text: 'Note' }],
                    location: {
                        file: 'test.ts',
                        line: 1,
                        column: 1,
                        lineText: '    const x = 1;    '
                    },
                    pluginName: 'esbuild'
                }
            ]
        };

        new esBuildError(mockErrorObj);

        expect(highlightCode).toHaveBeenCalledWith('const x = 1;');
    });

    test('should use reformatStack when no aggregateErrors present', () => {
        const mockErrorObj = <any>{
            message: 'Basic error',
            stack: 'Error: Basic error\n    at file.ts:10:5'
        };

        // We need to spy on the reformatStack method which is inherited from BaseError
        const reformatStackSpy = jest.spyOn<any, any>(esBuildError.prototype, 'reformatStack');

        new esBuildError(mockErrorObj);

        expect(reformatStackSpy).toHaveBeenCalledWith(mockErrorObj, true);

        reformatStackSpy.mockRestore();
    });
});
