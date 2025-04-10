/**
 * Represents a location in a source file with line and column information.
 *
 * @remarks
 * This interface is typically used to represent a specific position in a source code,
 * The `line` and `column` values are 10-based indices.
 *
 * @example
 * ```ts
 * const position: InvocationLocationInterface = {
 *   line: 42,
 *   column: 10
 * };
 * ```
 *
 * @see TextDocument
 * @see SourceMapper
 *
 * @since 1.0.0
 */

export type InvocationLocationInterface = {
    line: number;
    column: number;
};
