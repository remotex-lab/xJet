/**
 * Imports
 */

import { Colors, setColor } from '@components/colors.component';
import { formatCode, highlightCode } from '@remotex-labs/xmap';
import { esBuildError } from '@errors/esbuild.error';

/**
 * Mock dependencies
 */

jest.mock('@components/colors.component', () => ({
    Colors: {
        LightCoral: 'lightCoral',
        DarkGray: 'darkGray',
        Gray: 'gray'
    },
    setColor: jest.fn((color, text) => `[${color}]${text}[/${color}]`)
}));

jest.mock('@remotex-labs/xmap', () => ({
    formatCode: jest.fn(code => `formatted(${code})`),
    highlightCode: jest.fn(code => `highlighted(${code})`)
}));

/**
 * Tests
 */

describe('esBuildError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create an instance with correct name and message', () => {
        const error = new esBuildError([]);
        expect(error.name).toBe('ESBuildError');
        expect(error.message).toBe('esBuildError build failed');
    });

    test('should format single error correctly', () => {
        const mockError: any = {
            text: 'Test error',
            notes: [{ text: 'Error note' }],
            location: {
                file: 'test.ts',
                line: 10,
                column: 5,
                lineText: 'const x = invalid;'
            }
        };

        const error: any = new esBuildError([ mockError ]);

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
        expect(error.formattedStack).toContain('ESBuildError');
        expect(error.formattedStack).toContain('formatted(highlighted(const x = invalid;))');
    });

    test('should handle multiple errors', () => {
        const mockErrors: any = [
            {
                text: 'First error',
                notes: [{ text: 'First note' }],
                location: {
                    file: 'first.ts',
                    line: 1,
                    column: 1,
                    lineText: 'const a = 1;'
                }
            },
            {
                text: 'Second error',
                notes: [{ text: 'Second note' }],
                location: {
                    file: 'second.ts',
                    line: 2,
                    column: 2,
                    lineText: 'const b = 2;'
                }
            }
        ];

        const error: any = new esBuildError(mockErrors);

        // Verify multiple errors are formatted
        expect(setColor).toHaveBeenCalledTimes(6); // 2 errors × 3 color calls each
        expect(highlightCode).toHaveBeenCalledTimes(2);
        expect(formatCode).toHaveBeenCalledTimes(2);

        // Verify both errors are in the stack
        expect(error.formattedStack).toContain('First error');
        expect(error.formattedStack).toContain('Second error');
    });

    test('should handle errors without notes', () => {
        const mockError: any = {
            text: 'Test error',
            notes: [],
            location: {
                file: 'test.ts',
                line: 1,
                column: 1,
                lineText: 'const x = 1;'
            }
        };

        const error: any = new esBuildError([ mockError ]);

        expect(error.formattedStack).toContain('Test error');
        expect(setColor).toHaveBeenCalledWith(
            Colors.LightCoral,
            'Test error: undefined'
        );
    });

    test('should trim line text in formatting', () => {
        const mockError: any = {
            text: 'Test error',
            notes: [{ text: 'Note' }],
            location: {
                file: 'test.ts',
                line: 1,
                column: 1,
                lineText: '    const x = 1;    '
            }
        };

        new esBuildError([ mockError ]);

        expect(highlightCode).toHaveBeenCalledWith('const x = 1;');
    });
});
