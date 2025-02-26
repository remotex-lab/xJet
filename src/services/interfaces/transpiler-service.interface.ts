/**
 * An interface that represents the result of a file transpilation process.
 *
 * @remarks
 * This interface is used to encapsulate the output of a file transpilation,
 * typically including the transpiled code and the corresponding source map
 * for debugging or development purposes.
 *
 * @since 1.0.0
 */

export interface TranspileFileInterface {
    code: string;
    sourceMap: string;
}
