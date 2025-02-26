/**
 * Import will remove at compile time
 */

import type { EntryPoints } from '@remotex-labs/xbuild';
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
    minify: true,
    outdir: `${ cwd() }`,
    format: 'cjs',
    target: 'esnext',
    platform: 'browser',
    sourcemap: 'external',
    mangleQuoted: true,
    sourcesContent: true,
    preserveSymlinks: true
};

/**
 * Transpiles multiple files using the provided build options and returns the transpiled code along with its source map.
 *
 * @param filePaths - Entry points for transpilation.
 * Can be a single file path or multiple entry points defined by EntryPoints type.
 * @param buildOptions - An optional object containing build configuration options.
 * If no options are provided, default options will be used.
 * @returns A promise that resolves to an object containing the transpiled code and the associated source map.
 *
 * @throws Error - Will throw an error if the build process fails.
 *
 * @remarks
 * This function combines the default build options with any custom options provided,
 * and uses esbuild to transpile the files.
 * The working directory is automatically set to the current working directory.
 *
 * The function performs the following steps:
 * 1. Merges default and custom build options
 * 2. Enables metafile generation
 * 3. Processes entry points
 * 4. Returns both the transpiled code and source map
 *
 * @example
 * ```typescript
 * // Basic usage with default options
 * const result1 = await transpileFiles(['./src/input.ts']);
 * console.log(result1.code);      // Transpiled code
 * console.log(result1.sourceMap); // Source map
 *
 * // Usage with custom build options
 * const customOptions: BuildOptions = {
 *     minify: true,
 *     format: 'esm',
 *     target: 'es2020'
 * };
 * const result2 = await transpileFiles(['./src/input1.ts', './src/input2.ts'], customOptions);
 * ```
 *
 * @see TranspileFileInterface
 * @see BuildOptions
 * @see EntryPoints
 *
 * @since 1.0.0
 */

export async function transpileFiles(filePaths: EntryPoints, buildOptions: BuildOptions = {}): Promise<Array<TranspileFileInterface>> {
    const options: BuildOptions = {
        absWorkingDir: cwd(),
        ...defaultBuildOptions,
        ...buildOptions,
        metafile: true,
        entryPoints: filePaths
    };

    const result = await build(options) as BuildResult<BuildOptions & Metafile>;
    const groupedFiles = result.outputFiles!.reduce((acc, file) => {
        const basePath = file.path.replace(/\.(map)$/, '');
        if (!acc[basePath]) {
            acc[basePath] = <TranspileFileInterface> {};
        }

        if (file.path.endsWith('.js.map')) {
            acc[basePath].sourceMap = file.text;
        } else if (file.path.endsWith('.js')) {
            acc[basePath].code = file.text;
        }

        return acc;
    }, {} as Record<string,TranspileFileInterface>);

    return Object.values(groupedFiles).filter(
        entry => entry.code && entry.sourceMap
    ) as Array<TranspileFileInterface>;
}

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
    const result = (await transpileFiles([ filePath ], buildOptions)).pop() as TranspileFileInterface;
    if (!result) {
        throw new Error('Failed to transpile file: No output generated');
    }

    return result;
}
