/**
 * Import will remove at compile time
 */

import type { CellInterface, RenderContext } from '@ui/interfaces/shadow-ui.interface';

/**
 * Imports
 */

import { stdin, stdout } from 'process';
import { ANSIEnum } from '@ui/constants/shadow-ui.constant';

/**
 * Manages terminal rendering operations with an optimized buffer-based approach
 *
 * @remarks
 * ShadowRenderer provides efficient terminal rendering capabilities by managing
 * a virtual buffer of character cells and only updating the terminal display when
 * content changes. This approach minimizes flickering and improves performance
 * by reducing unnecessary terminal operations.
 *
 * The renderer handles terminal setup, cursor management, content display, and
 * proper cleanup when rendering is complete.
 *
 * @example
 * ```ts
 * const renderer = new ShadowRenderer();
 * renderer.writeText(0, 0, "Hello World");
 * renderer.render();
 * renderer.dispose();
 * ```
 *
 * @see CellInterface
 *
 * @since 1.0.0
 */

export class ShadowRenderer {
    /**
     * The width of the terminal in character columns
     * @since 1.0.0
     */

    private width: number = 80;

    /**
     * The height of the terminal in character rows
     * @since 1.0.0
     */

    private height: number = 24;

    /**
     * Storage for character cells that represent the terminal content
     * @since 1.0.0
     */

    private buffer: Array<CellInterface[]> = [];

    /**
     * Tracks the starting row position from the previous render operation
     * @since 1.0.0
     */

    private lastStartRow = 0;

    /**
     * Cleanup function for terminal resize event listeners
     *
     * @remarks
     * Stores the function returned by syncTerminalSize() that, when called,
     * removes the resize event listener from stdout. This property ensures
     * proper cleanup of event handlers when the renderer is disposed.
     *
     * @see syncTerminalSize
     *
     * @since 1.0.0
     */

    private readonly syncTerminalSizeClean: () => void;

    /**
     * Initializes a new instance of the renderer and prepares the terminal environment
     *
     * @remarks
     * When a new renderer instance is created, it immediately performs several setup operations:
     * 1. Hides the terminal cursor to prevent visual distraction
     * 2. Clears the screen to provide a clean rendering surface
     * 3. Synchronizes the internal dimensions with the current terminal size
     *
     * These operations ensure the terminal is in a known state before any rendering begins.
     * The renderer maintains its own buffer that matches the terminal dimensions.
     *
     * @example
     * ```ts
     * const renderer = new ShadowRenderer();
     * // Terminal is now prepared for rendering with cursor hidden and screen cleared
     * ```
     *
     * @see hideCursor
     * @see clearScreen
     * @see syncTerminalSize
     *
     * @since 1.0.0
     */

    constructor() {
        this.hideCursor();
        this.clearScreen();
        this.syncTerminalSizeClean = this.syncTerminalSize();
    }

    /**
     * Gets the current row count in the buffer
     *
     * @returns The total number of rows in the buffer
     *
     * @remarks
     * This getter provides the current number of rows stored in the internal
     * buffer. This represents the total content height, which may differ from
     * the visible height (terminal height).
     *
     * The row count is 0-indexed, meaning the first row is at index 0. This
     * count reflects the actual buffer size and updates dynamically as content
     * is added or removed.
     *
     * Common use cases include:
     * - Determining the current position for appending new content
     * - Calculating scrolling limits
     * - Checking if content exceeds the visible terminal area
     *
     * @example
     * ```ts
     * const terminal = new Terminal();
     * terminal.writeText("Hello");
     * terminal.writeText("World");
     *
     * // Get the current row count
     * const currentRow = terminal.row;
     * console.log(`Buffer contains ${currentRow} rows`);
     *
     * // Append to the end of the buffer
     * terminal.writeText(terminal.row, 0, "New content");
     * ```
     *
     * @see buffer
     * @see height
     *
     * @since 1.0.0
     */

    get row(): number {
        return this.buffer.length;
    }

    /**
     * Gets the current height of the terminal in character rows
     *
     * @returns The number of visible rows in the terminal
     *
     * @remarks
     * This getter provides access to the terminal's height (number of rows) which
     * represents the vertical space available for rendering content. The height value
     * is synchronized with the actual terminal dimensions during initialization and
     * can be used to ensure content fits within the visible area.
     *
     * @see height
     * @see syncTerminalSize
     *
     * @since 1.0.0
     */

    get terminalHeight(): number {
        return this.height;
    }

    /**
     * Gets the current width of the terminal in character columns
     *
     * @returns The number of visible columns in the terminal
     *
     * @remarks
     * This getter provides access to the terminal's width (number of columns) which
     * represents the horizontal space available for rendering content. The width value
     * is synchronized with the actual terminal dimensions during initialization and
     * can be used for proper text wrapping and layout calculations.
     *
     * @see width
     * @see syncTerminalSize
     *
     * @since 1.0.0
     */

    get terminalWidth(): number {
        return this.width;
    }

    /**
     * Cleans up resources and restores the terminal to its original state
     *
     * @remarks
     * This method should be called when the renderer is no longer needed to ensure
     * proper cleanup of terminal state. It makes the cursor visible again,
     * restoring the terminal to its normal interactive state.
     *
     * Failing to call dispose() may leave the terminal cursor hidden, which could
     * affect user experience in subsequent terminal usage.
     *
     * @example
     * ```ts
     * const renderer = new ShadowRenderer();
     * // Use the renderer...
     * renderer.dispose();
     * // Terminal cursor is now visible again
     * ```
     *
     * @see showCursor
     *
     * @since 1.0.0
     */

    dispose(): void {
        stdin.pause();
        this.showCursor();
        stdin.setRawMode(false);
        this.syncTerminalSizeClean();
    }

    /**
     * Clears both the internal buffer and the terminal screen
     *
     * @remarks
     * This method performs a complete reset of the rendering state by:
     * 1. Emptying the internal buffer that tracks character cells
     * 2. Updating the buffer dimensions to match the current terminal size
     * 3. Moving the cursor to the top-left position (0,0)
     * 4. Clearing all content from the cursor position to the end of the screen
     *
     * Unlike clearScreen(), which only affects the visible terminal, this method
     * also resets the internal buffer state.
     *
     * @example
     * ```ts
     * const renderer = new ShadowRenderer();
     * // After some rendering operations
     * renderer.clear();
     * // Both internal buffer and visible terminal are now cleared
     * ```
     *
     * @see moveCursor
     * @see ANSIEnum.CLEAR_SCREEN_DOWN
     *
     * @since 1.0.0
     */

    clear(): void {
        this.buffer = [];
        this.writeRaw(this.moveCursor(1, 1) + ANSIEnum.CLEAR_SCREEN_DOWN);
    }

    /**
     * Writes text to the buffer at the specified position
     *
     * @param row - The row position where text should be written (0-indexed)
     * @param column - The column position where text should begin (0-indexed)
     * @param text - The string content to write to the buffer
     *
     * @remarks
     * This method writes the provided text to the internal buffer at the specified position,
     * marking affected cells as dirty for future rendering. The method applies several
     * important constraints:
     *
     * - If the row is negative or the column exceeds the terminal width, the operation is silently skipped
     * - Text is clipped to fit within the terminal width
     * - If the line at the specified row doesn't exist, it's created automatically
     * - Only characters that differ from existing content are marked as dirty
     * - A null terminator is added if the text ends before the end of an existing line
     * - Line length is adjusted to fit within terminal width
     *
     * Changes made by this method are not immediately visible in the terminal.
     * Call `render()` to update the display with the modified buffer contents.
     *
     * @example
     * ```ts
     * // Write text at the beginning of the first line
     * terminal.writeText(0, 0, "Hello, world!");
     *
     * // Write text at row 5, 10 columns from the left
     * terminal.writeText(5, 10, "Position (5,10)");
     *
     * // Display the changes on screen
     * terminal.render();
     * ```
     *
     * @see render
     * @see renderAll
     *
     * @since 1.0.0
     */

    writeText(row: number, column: number, text: string): void {
        if (row < 0 || column >= this.width) return;

        const trimmed = text.split('\n')[0];
        const line = this.buffer[row] ??= [];
        const limit = Math.min(this.width - column, trimmed.length);

        for (let i = 0; i < limit; i++) {
            const col = column + i;
            const char = trimmed[i];

            if (!line[col]) line[col] = { char: ' ', dirty: true };
            if (line[col].char !== char) {
                line[col].char = char;
                line[col].dirty = true;
            }
        }

        if (column + limit < line.length) {
            line[limit].char = '\0';
            line[limit].dirty = true;
        }

        line.length = Math.min(this.width, line.length);
    }

    /**
     * Renders only the changed (dirty) cells to the terminal
     *
     * @remarks
     * This method performs an optimized render of the buffer contents to the terminal
     * by only updating cells that have been marked as dirty since the last render.
     * The process follows these steps:
     *
     * 1. Synchronizes the terminal dimensions to handle window resizing
     * 2. Calculates a scrolling window based on buffer size and terminal height
     * 3. Iterates through each visible row and cell in the buffer
     * 4. Builds a string of ANSI cursor movements and characters for changed cells
     * 5. Writes the batch of changes to the terminal in a single operation
     * 6. Positions the cursor at the bottom of the rendered content
     *
     * The rendering algorithm includes several optimizations:
     * - Only processes cells marked as dirty
     * - Minimizes cursor movements by batching consecutive dirty cells
     * - Handles null terminator characters ('0') by clearing to end of line
     * - Automatically scrolls content that exceeds terminal height
     * - Clears dirty flags after rendering
     *
     * After rendering, all rendered cells are marked as clean until modified again.
     *
     * @example
     * ```ts
     * // Update multiple parts of the buffer
     * terminal.writeText(0, 0, "First line");
     * terminal.writeText(1, 5, "Indented second line");
     *
     * // Render only the changed parts efficiently
     * terminal.render();
     * ```
     *
     * @see writeText
     * @see internalRender
     *
     * @since 1.0.0
     */

    render(): void {
        this.internalRender();
    }

    /**
     * Renders the entire buffer to the terminal
     *
     * @remarks
     * This method performs a complete rendering of the entire buffer contents to the terminal,
     * regardless of which cells are marked as dirty. Unlike the standard `render()` method,
     * this performs a full redraw which can be useful in certain scenarios.
     *
     * The process follows these steps:
     * 1. Moves cursor to the top-left position (0,0)
     * 2. Synchronizes the terminal dimensions to handle window resizing
     * 3. Iterates through every row and cell in the buffer sequentially
     * 4. Builds a complete string of all visible characters
     * 5. Writes the entire buffer to the terminal in a single operation
     * 6. Positions the cursor at the bottom of the rendered content
     *
     * Special handling:
     * - Null terminator characters ('0') are processed by clearing to the end of line
     * - All cells are marked as clean after rendering
     * - Each row is terminated with a newline character
     *
     * This method is more resource-intensive than the standard `render()` method and
     * should be used sparingly, primarily in these situations:
     * - Initial rendering of complex content
     * - After terminal resize events
     * - When the display may be corrupted or inconsistent
     * - When the buffer has undergone extensive changes
     *
     * @example
     * ```ts
     * // After major content changes or terminal resize
     * terminal.renderAll();
     *
     * // For normal updates, prefer the more efficient render() method
     * terminal.writeText(0, 0, "New text");
     * terminal.render();
     * ```
     *
     * @see writeText
     * @see internalRender
     *
     * @since 1.0.0
     */

    renderAll(): void {
        this.internalRender(true);
    }

    /**
     * Writes raw data directly to the standard output
     *
     * @param data - The string or Buffer content to write to stdout
     *
     * @remarks
     * This is a low-level method that bypasses the buffering system and sends
     * data directly to the terminal's standard output stream. It's primarily used
     * internally by render operations and should not typically be called directly.
     *
     * The method accepts either string content or a Node.js Buffer object, making it
     * flexible for different types of terminal output operations, including both
     * text and binary control sequences.
     *
     * @example
     * ```ts
     * // Internal usage example (not recommended for direct calling)
     * this.writeRaw('\x1b[2J'); // Send ANSI escape sequence to clear screen
     * this.writeRaw(Buffer.from([0x1b, 0x5b, 0x48])); // Send cursor home sequence
     * ```
     *
     * @see render
     * @see renderAll
     *
     * @since 1.0.0
     */

    private writeRaw(data: string | Buffer): void {
        stdout.write(data);
    }

    /**
     * Synchronizes the renderer's dimensions with the terminal window and sets up resize handling
     *
     * @returns A cleanup function that removes all event listeners when called
     *
     * @throws Error - If stdout or stdin are not available in the current environment
     *
     * @remarks
     * This method configures the terminal for proper rendering and event handling:
     * 1. Sets up terminal dimension tracking that updates on resize events
     * 2. Configures raw input mode to capture Ctrl+C for proper cleanup
     * 3. Performs an initial size update and screen clearing
     * 4. Returns a cleanup function to remove all registered event listeners
     *
     * The method puts stdin in raw mode and resume state to capture keyboard events.
     * When the terminal is resized, it automatically updates dimensions, clears the
     * screen, and re-renders all content to fit the new dimensions.
     *
     * @example
     * ```ts
     * // Setting up terminal size synchronization with proper cleanup
     * const cleanupFunction = this.syncTerminalSize();
     *
     * // Later when done with the renderer
     * cleanupFunction();
     * ```
     *
     * @see width
     * @see height
     * @see dispose
     * @see renderAll
     *
     * @since 1.0.0
     */

    private syncTerminalSize(): () => void {
        const updateSize = () => {
            this.height = stdout.rows || 24;
            this.width = stdout.columns || 80;
            this.writeRaw(this.moveCursor(1, 1) + ANSIEnum.CLEAR_SCREEN_DOWN);
            this.renderAll();
        };

        const handleExit = (data: Buffer) => {
            if (data.toString() === '\x03') { // Ctrl+C
                this.dispose();
                process.exit();
            }
        };

        // Set up
        stdin.setRawMode(true);
        stdin.resume();
        stdin.on('data', handleExit);
        stdout.on('resize', updateSize);

        // Initial draw
        updateSize();

        // Return cleanup function
        return () => {
            stdout.removeListener('resize', updateSize);
            stdin.removeListener('data', handleExit);
        };
    }

    /**
     * Clears the entire screen content
     *
     * @remarks
     * This method sends the ANSI escape sequence to clear the entire terminal screen
     * and reset the cursor position to the top-left corner (0, 0). It directly writes
     * the control sequence to stdout without affecting the internal buffer state.
     *
     * Use this method sparingly as it can cause flickering on some terminals. For
     * incremental updates, prefer using the render() method which only updates
     * changed cells.
     *
     * @see writeRaw
     * @see ANSIEnum.CLEAR_SCREEN
     *
     * @since 1.0.0
     */

    private clearScreen(): void {
        this.writeRaw(ANSIEnum.CLEAR_SCREEN);
    }

    /**
     * Hides the terminal cursor
     *
     * @remarks
     * This method sends the ANSI escape sequence to hide the terminal cursor.
     * Hiding the cursor is useful during batch rendering operations to prevent
     * cursor flickering while content is being updated.
     *
     * Always ensure the cursor is made visible again using showCursor() when
     * rendering is complete, as leaving the cursor hidden can confuse users.
     *
     * @see writeRaw
     * @see showCursor
     * @see ANSIEnum.HIDE_CURSOR
     *
     * @since 1.0.0
     */

    private hideCursor(): void {
        this.writeRaw(ANSIEnum.HIDE_CURSOR);
    }

    /**
     * Shows the terminal cursor
     *
     * @remarks
     * This method sends the ANSI escape sequence to make the terminal cursor visible.
     * It's typically called after rendering operations that previously hid the cursor.
     *
     * Always call this method after hideCursor() operations to restore normal terminal
     * interaction, as a permanently hidden cursor can lead to a confusing user experience.
     *
     * @see writeRaw
     * @see hideCursor
     * @see ANSIEnum.SHOW_CURSOR
     *
     * @since 1.0.0
     */

    private showCursor(): void {
        this.writeRaw(ANSIEnum.SHOW_CURSOR);
    }

    /**
     * Generates an ANSI escape sequence to move the cursor to a specific position
     *
     * @param row - The target row (1-based index)
     * @param column - The target column (1-based index), defaults to 0 (start of line)
     * @returns The ANSI escape sequence string for cursor positioning
     *
     * @remarks
     * This method creates an ANSI escape sequence for cursor positioning without
     * directly writing it to the output. Unlike other cursor-related methods, this
     * one returns the sequence as a string, allowing it to be combined with other
     * output operations.
     *
     * Note that terminal cursor positioning uses 1-based indexing (the top-left
     * position is 1,1, not 0,0).
     *
     * @example
     * ```ts
     * // Internal usage example
     * const cursorAtTopLeft = this.moveCursor(1, 1);
     * const cursorAtRow5 = this.moveCursor(5);
     * this.writeRaw(cursorAtTopLeft + "Hello" + cursorAtRow5 + "World");
     * ```
     *
     * @see render
     * @see renderAll
     *
     * @since 1.0.0
     */

    private moveCursor(row: number, column: number = 0): string {
        return `\x1b[${ row };${ column }H`;
    }

    /**
     * Processes a single row of buffer data for rendering to the terminal
     *
     * @param row - The buffer row index to process
     * @param startRow - The starting row index of the current render operation
     * @param context - The rendering context containing output and line offset data
     * @param forceRender - When true, renders all cells regardless of dirty state
     * @returns True if the row was deleted during processing, false otherwise
     *
     * @remarks
     * This method handles the detailed rendering logic for an individual row in the buffer.
     * It implements several key features:
     *
     * 1. Detects and processes special null character markers for line deletion
     * 2. Performs intelligent cursor positioning to minimize terminal operations
     * 3. Only updates cells marked as dirty unless a force render is requested
     * 4. Handles partial line clearing when needed
     * 5. Maintains cell rendering state for future optimization
     *
     * The method reports whether the row was deleted during processing, which allows
     * the calling render loop to adjust its iteration accordingly. The context parameter
     * accumulates rendering commands and tracking information across multiple row operations.
     *
     * @example
     * ```ts
     * const context: RenderContext = { output: '', lineOffset: 0 };
     * const rowDeleted = this.processRow(5, 0, context, false);
     * if (rowDeleted) {
     *   // Handle row deletion, perhaps adjusting iteration
     * }
     * ```
     *
     * @see moveCursor
     * @see RenderContext
     * @see internalRender
     *
     * @since 1.0.0
     */

    private processRow(row: number, startRow: number, context: RenderContext, forceRender: boolean): boolean {
        const line = this.buffer[row];
        if (!line) return false;

        // Check for null line marker and handle deletion
        if (line[0]?.char === '\0' || line.length === 0) {
            const screenRow = (row - startRow) + context.lineOffset + 1;
            context.output += this.moveCursor(screenRow, 1) + ANSIEnum.CLEAR_LINE;

            this.buffer.splice(row, 1);
            context.lineOffset++; // Account for vertical shift in rendering

            return true; // Signal that a row was deleted
        }

        let needsCursorMove = true;
        for (let col = 0; col < line.length; col++) {
            const cell = line[col];
            if (!cell?.dirty && !forceRender && startRow === this.lastStartRow) {
                needsCursorMove = true;
                continue;
            }

            if (needsCursorMove) {
                const screenRow = forceRender ? (row + 1) : ((row - startRow) + 1);
                const screenCol = col + 1;
                if(forceRender && row > this.height) {
                    // todo fix render-all better solution
                    context.output += '\x1bD';
                }

                context.output += this.moveCursor(screenRow, screenCol);
                needsCursorMove = false;
            }

            if (cell.char === '\0') {
                this.buffer[row].splice(col, 1);
                context.output += ANSIEnum.CLEAR_LINE;
                break;
            }

            context.output += cell.char;
            cell.dirty = false;
        }

        return false; // No row was deleted
    }

    /**
     * Performs the actual rendering of buffer content to the terminal
     *
     * @param forceRender - When true, performs a complete re-render of all content
     *
     * @remarks
     * This method handles the core rendering logic, transforming the buffer data
     * into terminal output. It implements several optimizations:
     *
     * 1. Syncs terminal size to adapt to window changes
     * 2. Supports partial rendering with automatic scrolling for performance
     * 3. Processes only visible rows that fit within the terminal height
     * 4. Batches output changes to minimize terminal I/O operations
     * 5. Maintains cursor position for consistent user experience
     *
     * The method calculates a visible window based on the buffer size and terminal
     * height, rendering only what can be displayed. For partial renders, it shows the most
     * recent content by calculating an appropriate starting row.
     *
     * @example
     * ```ts
     * // Force a complete redraw of the terminal
     * this.internalRender(true);
     *
     * // Perform an optimized partial render
     * this.internalRender();
     * ```
     *
     * @see writeRaw
     * @see processRow
     * @see moveCursor
     *
     * @since 1.0.0
     */

    private internalRender(forceRender: boolean = false): void {
        // For full rendering, position cursor at top-left
        if (forceRender) {
            this.moveCursor(0, 0);
        }

        const context: RenderContext = {
            output: '',
            lineOffset: 0
        };

        // Calculate starting row for scroll window (only for partial renders)
        const startRow = forceRender ? 0 : Math.max(0, (this.buffer.length + 1) - this.height);
        for (let row = startRow; row < this.buffer.length; row++) {
            const rowDeleted = this.processRow(row, startRow, context, forceRender);
            if (rowDeleted) {
                row--; // Recheck the current row after deletion
            }
        }

        // Update terminal with changes
        if (context.output) {
            this.writeRaw(context.output);
        }

        // Position cursor at the bottom of content
        const lastRow = Math.min(this.height, this.buffer.length - startRow);
        this.writeRaw(this.moveCursor(lastRow + 1, 1));

        // Track rendering state for optimization
        if (forceRender) {
            this.lastStartRow = startRow;
        }
    }
}
