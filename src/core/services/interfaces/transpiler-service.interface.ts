/**
 * Interface representing the result of transpiling a TypeScript or JavaScript file.
 * This interface contains the transpiled code and its associated source map, which can be used
 * to debug or analyze the transpiled output.
 *
 * ## Properties:
 *  - **code**: A string representing the transpiled code.
 *      - This property holds the code after it has been processed by the transpiler.
 *  - **sourceMap**: A string representing the source map for the transpiled code.
 *      - This property contains the source map in string format, which helps map the transpiled code
 *        back to the original source for debugging purposes.
 *
 * @example
 *
 * ```ts
 * const transpileResult: TranspileFileInterface = {
 *   code: 'const x = 10;',
 *   sourceMap: 'source-map-content-here'
 * };
 * console.log(transpileResult.code); // Transpiled code
 * console.log(transpileResult.sourceMap); // Source map for the transpiled code
 * ```
 * @since v1.0.0
 */

export interface TranspileFileInterface {
    code: string;
    sourceMap: string;
}
