/**
 * Imports
 */

import { stdout } from 'process';
import { ShadowRenderer } from '@ui/shadow.ui';

/**
 * Mock dependencies
 */

jest.mock('process', () => ({
    stdout: {
        on: jest.fn(),
        rows: 30,
        write: jest.fn(),
        columns: 100,
        removeListener: jest.fn()
    },
    stdin: {
        on: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        setRawMode: jest.fn(),
        removeListener: jest.fn()
    }
}));

jest.mock('@ui/constants/shadow-ui.constant', () => ({
    ANSIEnum: {
        CLEAR_LINE: '\x1b[K',
        HIDE_CURSOR: '\x1b[?25l',
        SHOW_CURSOR: '\x1b[?25h',
        CLEAR_SCREEN: '\x1b[2J',
        CLEAR_SCREEN_DOWN: '\x1b[J'
    }
}));

/**
 * Tests
 */

describe('ShadowRenderer', () => {
    let renderer: ShadowRenderer;

    beforeEach(() => {
        jest.clearAllMocks();
        renderer = new ShadowRenderer();
    });

    afterEach(() => {
        renderer.dispose();
    });

    test('should initialize with correct values', () => {
        // The constructor should initialize properties and call methods
        expect(stdout.write).toHaveBeenCalledWith('\x1b[?25l'); // hide cursor
        expect(stdout.write).toHaveBeenCalledWith('\x1b[2J'); // clear screen
    });

    test('should clear the buffer and screen', () => {
        renderer.clear();

        // Check that the buffer is cleared
        expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('\x1b[J')); // clear screen down
    });

    test('should write text to buffer', () => {
        // Spy on private method
        const writeRawSpy = jest.spyOn(renderer as any, 'writeRaw');

        renderer.writeText(0, 0, 'Hello');

        // Writing text shouldn't call writeRaw immediately (only on render)
        expect(writeRawSpy).not.toHaveBeenCalledWith('Hello');

        // Now render and check output
        renderer.render();

        // render should call writeRaw with the cursor position and the text
        expect(writeRawSpy).toHaveBeenCalled();
    });

    test('should not write text outside boundaries', () => {
        const writeRawSpy = jest.spyOn(renderer as any, 'writeRaw');

        // Write text outside vertical boundary
        renderer.writeText(-1, 0, 'Outside');
        renderer.render();

        // Should not render text at negative row
        expect(writeRawSpy).not.toHaveBeenCalledWith(expect.stringContaining('Outside'));

        // Write text outside horizontal boundary (assuming width is set to a value)
        jest.clearAllMocks();
        renderer.writeText(0, 1000, 'Too far right');
        renderer.render();

        // Should not render text beyond width
        expect(writeRawSpy).not.toHaveBeenCalledWith(expect.stringContaining('Too far right'));
    });

    test('should show cursor when disposed', () => {
        renderer.dispose();

        // Check that the cursor is shown
        expect(stdout.write).toHaveBeenCalledWith('\x1b[?25h');
    });

    test('should sync terminal size', () => {
        const emit = stdout.on as jest.Mock;
        emit.mockReset();

        const syncSpy = jest.spyOn(ShadowRenderer.prototype as any, 'syncTerminalSize');
        const newRenderer = new ShadowRenderer();

        expect(syncSpy).toHaveBeenCalledTimes(1);
        newRenderer.clear();

        (stdout.columns as number) = 120;
        (stdout.rows as number) = 40;
        emit.mock.calls[0][1]();

        expect(syncSpy).toHaveBeenCalledTimes(1);

        const writeRawSpy = jest.spyOn(newRenderer as any, 'writeRaw');
        newRenderer.writeText(0, 100, 'Text beyond original width');
        newRenderer.render();

        expect(writeRawSpy).toHaveBeenCalled();
        expect(writeRawSpy).toHaveBeenCalledWith('\x1B[1;101HText beyond original');
        expect((newRenderer as any).width).toBe(120);
        expect((newRenderer as any).height).toBe(40);

        newRenderer.dispose();
        syncSpy.mockRestore();
    });

    test('renderAll should render the entire buffer', () => {
        // Write some text
        renderer.writeText(0, 0, 'Line 1');
        renderer.writeText(1, 0, 'Line 2');

        // Spy on writeRaw
        const writeRawSpy = jest.spyOn(renderer as any, 'writeRaw');

        // Render all
        renderer.renderAll();

        // Check that writeRaw was called with appropriate content
        expect(writeRawSpy).toHaveBeenCalled();
        // It's hard to check exact output due to ANSI codes and complex rendering logic
        // but we can verify it was called with something containing our text
        expect(writeRawSpy).toHaveBeenCalledWith(expect.stringContaining('Line 1'));
    });

    // Test null terminator character handling
    test('should handle null terminator character', () => {
        // Create a scenario where a null character would be inserted
        renderer.writeText(0, 0, 'ABC');
        renderer.writeText(0, 0, 'A'); // This should make 'B' become null terminator

        const writeRawSpy = jest.spyOn(renderer as any, 'writeRaw');
        renderer.render();

        // Check that CLEAR_LINE was called
        expect(writeRawSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[K'));
    });
});
