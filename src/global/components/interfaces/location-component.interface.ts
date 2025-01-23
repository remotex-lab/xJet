/**
 * Represents a location in a source file with line and column information.
 *
 * @remarks
 * This interface is typically used to represent a specific position
 * in a text document, commonly related to compilers, parsers, or text
 * editor utilities.
 * The `line` and `column` values are 1-based indices.
 *
 * @since 1.0.0
 */

export type InvocationLocationInterface = {
    line: number;
    column: number;
};
