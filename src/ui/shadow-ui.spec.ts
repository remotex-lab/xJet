/**
 * Imports
 */

import { ShadowRenderer } from '@ui/shadow.ui';
import { moveCursor, writeRaw } from '@ui/ansi.ui';
import { ANSI } from '@ui/constants/ansi-ui.constant';

/**
 * Mock dependencies
 */

jest.mock('@ui/ansi.ui', () => ({
    moveCursor: jest.fn((row, col) => `MOCK_CURSOR_MOVE_${row}_${col}`),
    writeRaw: jest.fn()
}));

/**
 * Tests
 */

describe('ShadowRenderer', () => {
    let renderer: ShadowRenderer;

    beforeEach(() => {
        jest.clearAllMocks();
        // Create a renderer positioned at row 2, col 3 with a 10x5 viewport
        renderer = new ShadowRenderer(5, 10, 2, 3);
    });

    describe('initialization', () => {
        test('should initialize with the correct properties', () => {
            expect(renderer.top).toBe(2);
            expect(renderer.left).toBe(3);
            expect(renderer.width).toBe(10);
            expect(renderer.height).toBe(5);
            expect(renderer.scroll).toBe(0);
        });

        test('should allow changing dimensions and position', () => {
            renderer.top = 5;
            renderer.left = 7;
            renderer.width = 20;
            renderer.height = 10;

            expect(renderer.top).toBe(5);
            expect(renderer.left).toBe(7);
            expect(renderer.width).toBe(20);
            expect(renderer.height).toBe(10);
        });
    });

    describe('writeText', () => {
        test('should write text to the internal buffer', () => {
            renderer.writeText(0, 0, 'Hello');
            // Trigger render to check if the text appears
            renderer.render();

            // The writeRaw should be called with a string containing the text
            expect(writeRaw).toHaveBeenCalled();
            const writeRawArg = (writeRaw as jest.Mock).mock.calls[0][0];
            expect(writeRawArg).toContain('Hello');
        });

        test('should truncate text that exceeds terminal width', () => {
            // Write text longer than the terminal width (10)
            renderer.writeText(0, 0, 'This is a very long text');
            renderer.render();

            // The full text shouldn't be in the output
            const writeRawArg = (writeRaw as jest.Mock).mock.calls[0][0];
            // Only 'This is a ' should be visible (10 characters)
            expect(writeRawArg).toContain('This is a ');
            expect(writeRawArg).not.toContain('very long text');
        });

        test('should only process the first line of multi-line text', () => {
            renderer.writeText(0, 0, 'Line 1\nLine 2');
            renderer.render();

            const writeRawArg = (writeRaw as jest.Mock).mock.calls[0][0];
            expect(writeRawArg).toContain('Line 1');
            expect(writeRawArg).not.toContain('Line 2');
        });

        test('should clean existing content when clean flag is true', () => {
            // First write without clean
            renderer.writeText(0, 0, 'Hello');

            // Then write with clean at a position that overlaps
            renderer.writeText(0, 3, 'World', true);
            renderer.render();

            const writeRawArg = (writeRaw as jest.Mock).mock.calls[0][0];
            // Should have removed 'Hello' and only have 'World'
            expect(writeRawArg).toContain('World');
            expect(writeRawArg).not.toContain('Hello');
        });
    });

    describe('render', () => {
        test('should only render dirty cells', () => {
            // Initial render
            renderer.writeText(0, 0, 'Hello');
            renderer.render();

            jest.clearAllMocks();

            // Render again without changes
            renderer.render();

            // Nothing should be written since no cells are dirty
            expect(writeRaw).toHaveBeenCalledWith(expect.not.stringContaining('Hello'));
        });

        test('should render all cells when force=true', () => {
            // Initial render
            renderer.writeText(0, 0, 'Hello');
            renderer.render();

            // Reset mocks to check next render
            jest.clearAllMocks();

            // Force render
            renderer.render(true);

            // All cells should be re-rendered
            const writeRawArg = (writeRaw as jest.Mock).mock.calls[0][0];
            expect(writeRawArg).toContain('Hello');
        });

        test('should clean up extra rows when content shrinks', () => {
            // Initial content with multiple rows
            renderer.writeText(0, 0, 'Row 1');
            renderer.writeText(1, 0, 'Row 2');
            renderer.writeText(2, 0, 'Row 3');
            renderer.render();

            // Reset mocks for next render
            jest.clearAllMocks();

            // Clear content
            renderer.clear();
            renderer.writeText(0, 0, 'Only row');
            renderer.render();

            // Should clear the extra rows
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining(ANSI.CLEAR_LINE));
        });
    });

    describe('scroll', () => {
        beforeEach(() => {
            // Setup content for scrolling tests
            renderer.writeText(0, 0, 'Line 1');
            renderer.writeText(1, 0, 'Line 2');
            renderer.writeText(2, 0, 'Line 3');
            renderer.writeText(3, 0, 'Line 4');
            renderer.writeText(4, 0, 'Line 5');
            renderer.writeText(5, 0, 'Line 6');
            renderer.writeText(6, 0, 'Line 7');
            renderer.render();
            jest.clearAllMocks();
        });

        test('should update scroll position with absolute value', () => {
            // Setup content for scrolling tests - add multiple lines
            for (let i = 0; i < 10; i++) {
                renderer.writeText(i, 0, `Line ${i + 1}`);
            }

            // Initial render to establish the content
            renderer.render();

            // Reset mocks to focus on the scroll operation
            jest.clearAllMocks();

            // Mock writeRaw to capture its argument
            (writeRaw as jest.Mock).mockImplementation((str) => {
                // Store the string for assertions
            });

            // Set the scroll position
            renderer.scroll = 2;

            // Verify scroll position was updated
            expect(renderer.scroll).toBe(2);

            // Verify that writeRaw was called
            expect(writeRaw).toHaveBeenCalled();

            // One approach is to spy on the render method
            const renderSpy = jest.spyOn(renderer, 'render');

            // Reset mock to test the next scroll operation
            jest.clearAllMocks();

            // Do another scroll operation
            renderer.scroll = 3;

            // Verify render was called by the scroll setter
            expect(renderSpy).toHaveBeenCalled();
            expect(renderer.scroll).toBe(3);
        });

        test('should handle relative scrolling with negative values', () => {

            const renderSpy = jest.spyOn(renderer, 'render');

            renderer.scroll = 3;
            expect(renderer.scroll).toBe(3);

            jest.clearAllMocks();
            renderer.scroll = -2;

            expect(renderer.scroll).toBe(1);
            expect(renderSpy).toHaveBeenCalled();
            expect(writeRaw).toHaveBeenCalled();
        });

        test('should ignore scrolling beyond content boundaries', () => {
            // Try to scroll beyond content length
            renderer.scroll = 10;

            // Should not change the scroll position
            expect(renderer.scroll).toBe(0);
            // Should not render
            expect(writeRaw).not.toHaveBeenCalled();
        });
    });
});
