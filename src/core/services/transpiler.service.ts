/**
 * Import will remove at compile time
 */

import type { BuildOptions, BuildResult, Metafile } from 'esbuild';
import type { TranspileFileInterface } from '@core/services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build } from 'esbuild';

/**
 * The default build options used for transpiling a file.
 *
 * These options provide a default configuration for the build process, specifying settings such as whether
 * to bundle the code, whether to minify, the output directory, the format, and more.
 * These options can be customized as needed during the build process.
 *
 * ## Example:
 * ```ts
 * console.log(defaultBuildOptions.outdir); // 'tmp'
 * console.log(defaultBuildOptions.format); // 'cjs'
 * console.log(defaultBuildOptions.bundle); // true
 * ```
 *
 * @remarks
 * buildOptions: For more details, refer to the
 * {@link https://esbuild.github.io/api/#build} for esbuild build options documentation.
 *
 * @see BuildOptions
 * @since v1.0.0
 */

export const defaultBuildOptions: BuildOptions = {
    write: false,
    bundle: true,
    minify: false,
    outdir: 'tmp',
    format: 'cjs',
    target: 'esnext',
    platform: 'browser',
    sourcemap: 'external',
    mangleQuoted: true,
    sourcesContent: true,
    preserveSymlinks: true
};

/**
 * Transpiles a TypeScript or JavaScript file to the desired output format using the provided build options.
 *
 * ## Input:
 *  - **filePath**: The path to the file to be transpiled.
 *      This must be a valid string representing the location of the source file.
 *  - **buildOptions** (optional): An object that allows customization of the build process.
 *      This object extends the default build options and can include properties such as entry points,
 *      working directory, and metafile generation.
 *
 * ## Output:
 * A `Promise` that resolves to an object containing the transpiled code (`code`) and its source map (`sourceMap`).
 *  - **code**: A string representing the transpiled code of the file.
 *  - **sourceMap**: A string representing the source map generated for the transpiled file.
 *
 * @example
 * ```ts
 * const result = await transpileFile('./src/index.ts', { minify: true });
 * console.log(result.code); // Transpiled file content
 * console.log(result.sourceMap); // Source map for the transpiled file
 * ```
 *
 * ## Error Handling:
 * The function assumes that the `filePath` provided is valid and points to an existing file.
 * - If the file does not exist or is not accessible, it will throw an error.
 * - If there are issues with the build process (e.g., invalid build options or compilation errors), the function will throw an error related to the build process.
 * @example
 * ```ts
 * try {
 *   const result = await transpileFile('invalid/path/to/file.ts');
 * } catch (error) {
 *   console.error('Transpilation failed:', error);
 * }
 * ```
 *
 * @param filePath - The path to the file to be transpiled.
 * @param buildOptions - Optional object to customize the build process.
 * @returns A promise {@link TranspileFileInterface} that resolves with an object
 * containing the transpiled code and source map.
 *
 * @throws Error - If the file path is invalid, or if there is an error during the build process.
 * @remarks
 * buildOptions: For more details, refer to the
 * {@link https://esbuild.github.io/api/#build} for esbuild build options documentation.
 *
 * @see BuildOptions
 * @since v1.0.0
 */

export async function transpileFile(filePath: string, buildOptions: BuildOptions = {}): Promise<TranspileFileInterface> {
    const options: BuildOptions = {
        absWorkingDir: cwd(),
        ...defaultBuildOptions,
        ...buildOptions,
        metafile: true,
        entryPoints: [ filePath ]
    };

    const result = await build(options) as BuildResult<BuildOptions & Metafile>;
    const [ sourceMap, fileContent ] = result.outputFiles!.map(file => file.text);

    return {
        code: fileContent,
        sourceMap
    };
}
