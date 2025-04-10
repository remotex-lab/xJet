/**
 * Import will remove at compile time
 */

import type { BuildOptions, BuildResult, Metafile } from 'esbuild';
import type { esBuildErrorInterfaces } from '@errors/interfaces/esbuild-error.interface';
import type { EntryPoints, TranspileFileTypes, TranspileFileInterface } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build } from 'esbuild';
import { xJetError } from '@errors/xjet.error';
import { esBuildError } from '@errors/esbuild.error';

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
 * Asynchronously builds a set of files based on the provided entry points and options.
 *
 * @param filePaths - An array or object containing the entry points for the files to build
 * @param buildOptions - An optional set of build options to customize the build process
 * @returns A promise of the build result, including metadata and the applied build options
 *
 * @throws esBuildError - If the build process encounters errors, throws a wrapped `esbuildErrors` exception
 *
 * @example
 * ```ts
 * import { buildFiles } from './builder';
 *
 * const entryPoints = ['src/main.ts', 'src/utils.ts'];
 * const options = { minify: true };
 *
 * buildFiles(entryPoints, options)
 *   .then(result => console.log('Build completed:', result))
 *   .catch(error => console.error('Build failed:', error));
 * ```
 *
 * @see EntryPoints
 * @see BuildOptions
 * @see BuildResult
 * @see https://esbuild.github.io/api/
 *
 * @since 1.0.0
 */

export async function buildFiles(filePaths: EntryPoints, buildOptions: BuildOptions = {}): Promise<BuildResult<BuildOptions & Metafile>> {
    try {
        return await build({
            absWorkingDir: cwd(),
            ...defaultBuildOptions,
            ...buildOptions,
            metafile: true,
            entryPoints: filePaths
        }) as BuildResult<BuildOptions & Metafile>;
    } catch (esbuildErrors) {
        throw new esBuildError(<esBuildErrorInterfaces> esbuildErrors);
    }
}

/**
 * Transpiles multiple files using the provided build options and returns the transpiled code along with its source map.
 *
 * @param filePaths - Entry points for transpilation.
 * Can be a single file path or multiple entry points defined by EntryPoints type.
 * @param buildOptions - An optional object containing build configuration options.
 * If no options are provided, default options will be used.
 * @returns A promise that resolves to an object containing the transpiled code and the associated source map.
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
 * @throws Error - Will throw an error if the build process fails.
 *
 * @example
 * ```ts
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

export async function transpileFiles(filePaths: EntryPoints, buildOptions: BuildOptions = {}): Promise<TranspileFileTypes> {
    const result = await buildFiles(filePaths, buildOptions);

    return result.outputFiles!.reduce((acc, file) => {
        const basePath = file.path.replace(/\.(map)$/, '').replace(/\.(js)$/, '');
        if (!acc[basePath]) {
            acc[basePath] = <TranspileFileInterface> {};
        }

        if (file.path.endsWith('.js.map')) {
            acc[basePath].sourceMap = file.text;
        } else if (file.path.endsWith('.js')) {
            acc[basePath].code = file.text;
        }

        return acc;
    }, {} as Record<string, TranspileFileInterface>);
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
 * ```ts
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
    const files = await transpileFiles([ filePath ], buildOptions);
    const result = Object.values(files)[0];
    if (!result) {
        throw new xJetError('Failed to transpile file: No output generated');
    }

    return result;
}
