/**
 * Import will remove at compile time
 */

import type { BuildOptions, BuildResult, Metafile } from 'esbuild';
import type { TranspileFileInterface } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build } from 'esbuild';

/**
 * Default configuration options for the transpile process.
 *
 * Provides common settings for bundling, output formatting, and handling source maps.
 * This object can be used as a base configuration and extended or altered as needed.
 *
 * @remarks
 * These options are highly configurable and are typically used to control various aspects of the output,
 * such as whether to minify the code, the output directory location, or the target platform.
 *
 * @since 1.0.0
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
 * Transpiles a given file using the provided build options and returns the transpiled code along with its source map.
 *
 * @param filePath - The file path of the source file to be transpiled.
 * @param buildOptions - An optional object containing build configuration options. If no options are provided, default options will be used.
 * @returns A promise that resolves to an object containing the transpiled code and the associated source map.
 *
 * @throws Error - Will throw an error if the build process fails.
 *
 * @remarks This method leverages the build system to transpile the file and returns the necessary outputs for further usage.
 *
 * @example
 * ```typescript
 * // Basic usage with default options
 * const result1 = await transpileFile('./src/input.ts');
 * console.log(result1.code);      // Transpiled code
 * console.log(result1.sourceMap); // Source map
 *
 * // Usage with custom build options
 * const customOptions: BuildOptions = {
 *     minify: true,
 *     format: 'esm',
 *     target: 'es2020',
 *     platform: 'node'
 * };
 * const result2 = await transpileFile('./src/input.ts', customOptions);
 * ```
 *
 * @see TranspileFileInterface
 *
 * @since 1.0.0
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
