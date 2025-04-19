/**
 * Represents a single character cell in the terminal with its properties
 *
 * @since 1.0.0
 */

export interface CellInterface {
    /**
     * The character to display in this cell
     * @since 1.0.0
     */

    char: string;

    /**
     * Indicates whether this cell has been modified and needs redrawing
     * @since 1.0.0
     */

    dirty: boolean;
}

/**
 * Context information passed during the rendering process
 *
 * @remarks
 * This interface encapsulates all the relevant information needed during
 * the rendering of a single line. It's used internally by the render method
 * to track the rendering state and accumulate output.
 *
 *
 * @since 1.0.0
 */

export interface RenderContext {
    /**
     * Whether to force redrawing of all cells regardless of dirty state
     * @since 1.0.0
     */

    force: boolean;

    /**
     * Accumulated output string to be written to the terminal
     * @since 1.0.0
     */

    output: string;

    /**
     * The current line in the view buffer being processed
     * @since 1.0.0
     */

    viewLine: Array<string>;

    /**
     * The screen row number currently being rendered
     * @since 1.0.0
     */


    screenRow: number;

    /**
     * The content line being rendered to the screen
     *
     * @see CellInterface
     * @since 1.0.0
     */

    contentLine: Array<CellInterface>;
}
