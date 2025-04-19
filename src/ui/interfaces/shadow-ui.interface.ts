/**
 * Represents a single character cell in the terminal buffer with tracking for render state
 *
 * @remarks
 * The interface is used by the ShadowRenderer to track individual character cells
 * in the terminal buffer. The dirty flag helps optimize rendering by only updating
 * cells that have changed since the last render.
 *
 * @see ShadowRenderer
 *
 * @since 1.0.0
 */

export interface CellInterface {
    /**
     * The character to display in this cell position
     * @since 1.0.0
     */

    char: string;

    /**
     * Indicates whether this cell needs to be redrawn during the next render
     * @since 1.0.0
     */

    dirty: boolean;
}

/**
 * Provides context information for rendering operations in the terminal buffer
 *
 * @remarks
 * This interface supplies the necessary state for rendering operations, including
 * the accumulated output string and the current vertical position offset in the terminal.
 * It's used by rendering components to maintain state during rendering cycles.
 *
 * @see CellInterface
 * @see ShadowRenderer
 *
 * @since 1.0.0
 */

export interface RenderContext {
    /**
     * The accumulated text output to be rendered to the terminal
     * @since 1.0.0
     */

    output: string;

    /**
     * The current vertical line position offset from the top of the rendering area
     * @since 1.0.0
     */

    lineOffset: number;
}
