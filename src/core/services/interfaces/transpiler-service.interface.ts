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

/**
 * Represents a mapping of file types to their corresponding transpile file interfaces.

 * @remarks
 * This type alias is a utility definition that facilitates organizing and mapping various file type keys
 * (represented as strings) to their associated `TranspileFileInterface`.
 * It is widely used in scenarios
 * where file transpilation processes depend on specific behaviors or properties associated with each type.
 *
 * @see TranspileFileInterface
 *
 * @since 1.0.0
 */

export type TranspileFileTypes = Record<string, TranspileFileInterface>;

/**
 * Maps file types to their transpilation results
 *
 * @remarks
 * Provides a type-safe way to organize transpilation results by file type.
 * Commonly used when handling multiple file types in a build process
 *
 * @example
 * ```ts
 * const fileTypes: TranspileFileTypes = {
 *   "typescript": { code: "...", sourceMap: "..." },
 *   "javascript": { code: "...", sourceMap: "..." }
 * };
 * ```
 *
 * @since 1.0.0
 */


export type EntryPoints = Array<string> | Record<string, string> | Array<{
    in: string;
    out: string;
}> | undefined;
