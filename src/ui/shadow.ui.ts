/**
 * Import will remove at compile time
 */

import type { CellInterface, RenderContext } from '@ui/interfaces/shadow-ui.interface';

/**
 * Imports
 */

import { moveCursor, writeRaw } from '@ui/ansi.ui';
import { ANSI } from '@ui/constants/ansi-ui.constant';

/**
 * A virtual terminal renderer that manages efficient screen updates
 *
 * @description
 * ShadowRenderer provides a mechanism to render content to the terminal
 * while minimizing the number of draw operations needed. It does this by
 * maintaining an internal representation of both the desired content and
 * the current terminal state, only updating parts of the screen that have
 * changed between render cycles.
 *
 * @remarks
 * The renderer maintains separate buffers for content (what should be displayed)
 * and view (what is currently displayed). During rendering, it performs a diff
 * between these buffers to determine the minimal set of changes needed to update
 * the terminal display.
 *
 * This class supports:
 * - Partial screen updates for performance
 * - Content scrolling
 * - Variable viewport dimensions
 * - Rich text styling through cell properties
 *
 * @example
 * ```typescript
 * // Create a new renderer positioned at row 2, column 3 with dimensions 80x24
 * const renderer = new ShadowRenderer(2, 3, 80, 24);
 *
 * // Set some content and render it
 * renderer.writeText(0, 0, contentCells);
 * renderer.render();
 * ```
 *
 * @since 1.0.0
 */

export class ShadowRenderer {
    /**
     * Current scroll position in the content
     *
     * @remarks
     * Tracks the index of the first row visible at the top of the viewport.
     * A value of 0 indicates the content is not scrolled, while higher values
     * indicate the content has been scrolled down by that many rows.
     *
     * This value is used during rendering to determine which portion of the
     * contentBuffer to display in the visible area of the terminal.
     *
     * @see scroll - The getter for accessing this value
     *
     * @private
     */

    private scrollPosition: number = 0;

    /**
     * Internal buffer representing the current visible state of the terminal
     *
     * @remarks
     * This two-dimensional array stores the actual rendered content as it appears in the terminal.
     * It's organized in a row-major format, with each row containing an array of strings.
     *
     * Unlike contentBuffer which stores full cell information, viewBuffer only contains
     * the string representation of each cell. This buffer is used for diffing against
     * new content to determine what needs to be redrawn during render operations,
     * allowing for efficient partial updates to the terminal display.
     *
     * @private
     */

    private viewBuffer: Array<string[]> = [];

    /**
     * Internal buffer containing the content to be rendered
     *
     * @remarks
     * This two-dimensional array stores all content cells in a row-major format,
     * where each row is an array of CellInterface objects representing individual
     * characters with their associated style information.
     *
     * The outer array represents rows, while the inner arrays represent columns within each row.
     * This structure allows for efficient access and manipulation of cell data during
     * the rendering process.
     *
     * @private
     * @see CellInterface
     */


    private contentBuffer: Array<CellInterface[]> = [];

    /**
     * Creates a new ShadowRenderer instance for terminal-based UI rendering
     *
     * @param terminalHeight - The height of the terminal viewport in rows
     * @param terminalWidth - The width of the terminal viewport in columns
     * @param topPosition - The top-offset position within the terminal
     * @param leftPosition - The left offset position within the terminal
     *
     * @since 1.0.0
     */

    constructor(
        private terminalHeight: number,
        private terminalWidth: number,
        private topPosition: number,
        private leftPosition: number
    ) {
    }

    /**
     * Gets the top position offset of the renderer in the terminal
     *
     * @returns The row offset from the top edge of the terminal
     *
     * @since 1.0.0
     */

    get top(): number {
        return this.topPosition;
    }

    /**
     * Gets the left position offset of the renderer in the terminal
     *
     * @returns The column offset from the left edge of the terminal
     *
     * @since 1.0.0
     */

    get left(): number {
        return this.leftPosition;
    }

    /**
     * Gets the width of the renderer's viewport
     *
     * @returns The number of columns visible in the renderer's viewport
     *
     * @since 1.0.0
     */

    get width(): number {
        return this.terminalWidth;
    }

    /**
     * Gets the height of the renderer's viewport
     *
     * @returns The number of rows visible in the renderer's viewport
     *
     * @since 1.0.0
     */

    get height(): number {
        return this.terminalHeight;
    }

    /**
     * Gets the current scroll position
     *
     * @returns The current row index at the top of the viewport
     *
     * @since 1.0.0
     */

    get scroll(): number {
        return this.scrollPosition;
    }

    /**
     * Sets the top position offset of the renderer in the terminal
     *
     * @param top - The row offset from the top edge of the terminal
     *
     * @remarks
     * This setter updates the vertical positioning of the renderer's viewport
     * within the terminal. The top position is used as an offset when calculating
     * absolute cursor positions during rendering operations.
     *
     * Note that changing the top position does not automatically trigger a re-render.
     * You should call the render() method separately after changing the position.
     *
     * @since 1.0.0
     */

    set top(top: number) {
        this.topPosition = top;
    }

    /**
     * Sets the left position offset of the renderer in the terminal
     *
     * @param left - The column offset from the left edge of the terminal
     *
     * @remarks
     * This setter updates the horizontal positioning of the renderer's viewport
     * within the terminal. The left position is used as an offset when calculating
     * absolute cursor positions during rendering operations.
     *
     * Note that changing the left position does not automatically trigger a re-render.
     * You should call the render() method separately after changing the position.
     *
     * @since 1.0.0
     */

    set left(left: number) {
        this.leftPosition = left;
    }

    /**
     * Sets the width of the renderer's viewport
     *
     * @param terminalWidth - The number of columns visible in the renderer's viewport
     *
     * @remarks
     * This setter updates the internal width property which controls how many
     * columns are rendered during the rendering process. This should be updated
     * whenever the terminal or display area is resized.
     *
     * Note that changing the width does not automatically trigger a re-render.
     * You should call the render() method separately after changing dimensions.
     *
     * @since 1.0.0
     */

    set width(terminalWidth: number) {
        this.terminalWidth = terminalWidth;
    }

    /**
     * Sets the height of the renderer's viewport
     *
     * @param terminalHeight - The number of rows visible in the renderer's viewport
     *
     * @remarks
     * This setter updates the internal height property which controls how many
     * rows are rendered during the rendering process. This should be updated
     * whenever the terminal or display area is resized.
     *
     * Note that changing the height does not automatically trigger a re-render.
     * You should call the render() method separately after changing dimensions.
     *
     * @since 1.0.0
     */

    set height(terminalHeight: number) {
        this.terminalHeight = terminalHeight;
    }

    /**
     * Sets the scroll position and renders the updated view
     *
     * @param position - New scroll position or relative movement (if negative)
     *
     * @remarks
     * This setter handles both absolute and relative scrolling:
     * - Positive values set the absolute scroll position
     * - Negative values move relative to the current position
     *
     * If the requested position would scroll beyond the end of content,
     * the operation is ignored. After setting a valid scroll position,
     * the view is automatically re-rendered.
     *
     * @example
     * ```ts
     * // Set absolute scroll position to row 10
     * renderer.scroll = 10;
     *
     * // Scroll up 3 rows (relative movement)
     * renderer.scroll = -3;
     * ```
     *
     * @since 1.0.0
     */

    set scroll(position: number) {
        // Calculate target position (handle negative values as relative movement)
        const targetPosition = position < 0
            ? this.scrollPosition + position  // Relative position
            : position;                       // Absolute position

        if (targetPosition >= this.contentBuffer.length) return;
        this.scrollPosition = targetPosition;
        this.render();
    }

    /**
     * Clears the renderer by removing all content from the screen and resetting internal buffers
     *
     * @returns This method doesn't return a value
     *
     * @example
     * ```ts
     * // Reset the renderer state completely
     * renderer.clear();
     * ```
     *
     * @since 1.0.0
     */

    clear(): void {
        this.clearScreen();
        this.viewBuffer = [];
        this.contentBuffer = [];
    }

    /**
     * Clears the visible content from the terminal screen
     *
     * @returns Nothing
     *
     * @remarks
     * This method builds a string of ANSI escape sequences that move the cursor
     * to the beginning of each line in the view buffer and then clears each line.
     * It doesn't reset the internal buffers, only clears the visible output.
     *
     * @example
     * ```ts
     * // Clear just the screen output without resetting buffers
     * renderer.clearScreen();
     * ```
     *
     * @since 1.0.0
     */

    clearScreen(): void {
        let output = '';
        for (let i = 0; i < this.viewBuffer.length; i++) {
            output += this.moveCursor(i, 0);
            output += ANSI.CLEAR_LINE;
        }

        writeRaw(output);
    }

    /**
     * Writes text to the specified position in the content buffer
     *
     * @param row - Row position (0-based)
     * @param column - Column position (0-based)
     * @param text - Text to write
     * @param clean - Whether to clear existing content first
     *
     * @remarks
     * This method only updates the internal content buffer and marks cells as dirty.
     * It doesn't immediately render to the screen - call render() to display changes.
     * Only the first line of multi-line text is processed, and a text is truncated
     * if it exceeds terminal boundaries.
     *
     * @example
     * ```ts
     * // Write text in the top-left corner
     * renderer.writeText(0, 0, "Hello world");
     *
     * // Write text at position (5,10) and clear any existing content
     * renderer.writeText(5, 10, "Menu Options", true);
     *
     * // Display the changes
     * renderer.render();
     * ```
     *
     * @since 1.0.0
     */

    writeText(row: number, column: number, text: string, clean: boolean = false): void {
        // Validate input
        if (row < 0 || column >= this.terminalWidth) return;

        const line = this.contentBuffer[row] ??= [];
        const content = text.split('\n')[0];
        const length = Math.min(this.terminalWidth - column, content.length);

        if (clean) {
            for (let i = 0; i < length + column; i++) delete line[i];
        }


        for (let i = 0; i < length; i++) {
            const col = column + i;
            const char = content[i];
            if (!line[col]) line[col] = { char: '', dirty: true };

            // Mark as dirty only if content changed
            if (line[col].char !== char) {
                line[col].char = char;
                line[col].dirty = true;
            }
        }

        line.length = Math.min(this.terminalWidth, column + length);
    }

    /**
     * Renders the content buffer to the screen using optimized terminal output
     *
     * @param force - Forces all cells to be redrawn, even if they haven't changed
     *
     * @remarks
     * This method performs an optimized render by:
     * - Only rendering the visible portion of the content buffer based on scroll position
     * - Only updating cells that have been marked as dirty (unless force=true)
     * - Clearing trailing content from previous renders
     * - Repositioning the cursor to the bottom right when finished
     *
     * If the content buffer is empty or all content is scrolled out of view,
     * the method will return early without performing any operations.
     *
     * @example
     * ```ts
     * // Normal render - only updates what changed
     * renderer.render();
     *
     * // Force redraw of everything, useful after terminal resize
     * renderer.render(true);
     * ```
     *
     * @since 1.0.0
     */

    render(force: boolean = false): void {
        const startRow = Math.min(this.scrollPosition, this.contentBuffer.length);
        const endRow = Math.min(startRow + this.terminalHeight, this.contentBuffer.length);

        if (startRow >= endRow) return;
        const context: RenderContext = {
            force,
            output: '',
            viewLine: [],
            screenRow: 1,
            contentLine: []
        };

        for (let bufferRow = startRow; bufferRow < endRow; bufferRow++, context.screenRow++) {
            context.contentLine = this.contentBuffer[bufferRow];
            context.viewLine = this.viewBuffer[context.screenRow] ??= [];
            this.renderLine(context);

            // Clean up any trailing content from previous renders
            if (context.viewLine.length > context.contentLine.length) {
                context.output += ANSI.CLEAR_LINE;
                context.viewLine.length = context.contentLine.length;
            }
        }

        // Clear any rows below our content
        if (endRow >= this.contentBuffer.length) {
            this.viewBuffer.length = context.screenRow;
            for (let i = context.screenRow; i <= this.terminalHeight; i++) {
                context.output += this.moveCursor(i, 0);
                context.output += ANSI.CLEAR_LINE;
            }
        }

        context.output += this.moveCursor(this.viewBuffer.length, this.terminalWidth);
        writeRaw(context.output);
    }

    /**
     * Renders a single line of content to the output buffer
     *
     * @param context - The current rendering context
     *
     * @remarks
     * This private method handles the optimization of terminal output by:
     * - Skipping cells that haven't changed since the last render
     * - Only moving the cursor when necessary
     * - Updating the view buffer to reflect what's been rendered
     * - Clearing the dirty flag on cells after they're processed
     *
     * The context object contains all state needed for the rendering process,
     * including the accumulating output string and references to the current
     * content and view lines.
     *
     * @private
     * @since 1.0.0
     */

    private renderLine(context: RenderContext): void {
        // Track when cursor movement is needed
        let needsCursorMove = true;

        // Process each cell in the row
        for (let col = 0; col < context.contentLine.length; col++) {
            const cell = context.contentLine[col];

            if (cell && !cell.dirty && cell.char === context.viewLine[col] && !context.force) {
                needsCursorMove = true;
                continue;
            }

            if (needsCursorMove) {
                context.output += this.moveCursor(context.screenRow, col + 1);
                needsCursorMove = false;
            }

            if (!cell) {
                context.viewLine[col] = ' ';
                context.output += ' ';
                continue;
            }

            // Update view buffer and output the character
            context.viewLine[col] = cell.char;
            context.output += cell.char;
            cell.dirty = false;
        }
    }

    /**
     * Generates ANSI escape sequence to move cursor to a position
     *
     * @param row - The row position relative to renderer's viewport
     * @param column - The column position relative to renderer's viewport (defaults to 0)
     * @returns ANSI escape sequence string for cursor positioning
     *
     * @remarks
     * This private helper method translates relative viewport coordinates to
     * absolute terminal coordinates by adding the renderer's top and left
     * position offsets. The returned value is a string containing the
     * appropriate ANSI escape sequence.
     *
     * @private
     * @since 1.0.0
     */

    private moveCursor(row: number, column: number = 0): string {
        return moveCursor(row + this.topPosition, column + this.leftPosition);
    }
}
