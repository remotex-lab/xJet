/**
 * Import will remove at compile time
 */

import type { LogLevelType, PackagesType } from '@configuration/interfaces/configuration.interface';

/**
 * Interface representing the parsed command-line arguments.
 *
 * This interface defines the structure of the object returned by the command-line argument parser (`argvParser`).
 * It includes various configuration options for a JavaScript and TypeScript testing framework, including settings for file selection,
 * matching patterns, logging, and execution behavior.
 */

export interface ArgvInterface {
    /**
     * The specific test file to run.
     * If not specified, the default behavior is to run all matching tests.
     */

    file: string;

    /**
     * An array of glob patterns used to locate test files.
     */

    match: Array<string>;

    /**
     * Enables or disables color output in the test results displayed in the terminal.
     * Set to `true` for colored output or `false` for plain text.
     */

    color: boolean;

    /**
     * Enables or disables watch mode for test execution.
     * When `true`, tests will re-run automatically
     * upon detecting changes in the files.
     */

    watch: boolean;

    /**
     * Path to the custom configuration file (e.g., `'xjet.config.ts'`).
     * The default is `'xjet.config.ts'`.
     */

    config: string;

    /**
     * The root directory for locating test files.
     * Can be specified as a string path or in glob format to target multiple directories.
     */

    rootDir: string;

    /**
     * Specifies the verbosity level for logging output.
     * Options:
     * - `'silent'`: No output
     * - `'error'`: Only errors are shown
     * - `'warn'`: Warnings and errors are shown
     * - `'info'`: General information, warnings, and errors
     * - `'debug'`: Detailed debugging output
     *
     * @example
     * ```ts
     * // Set log level to 'info'
     * const args = { logLevel: 'info' };
     * console.log(args.logLevel); // Output: 'info'
     * ```
     */

    logLevel: LogLevelType;

    /**
     * An array of external packages that should not be bundled with the test code.
     * These packages will be loaded externally to reduce bundle size.
     *
     * @example
     * ```ts
     * // Specify external packages
     * const args = { external: ['lodash', 'react'] };
     * console.log(args.external); // Output: ['lodash', 'react']
     * ```
     */

    external: Array<string>;

    /**
     * Specifies how esbuild should handle packages.
     * - `'bundle'`: Packages are bundled with the test code.
     * - `'external'`: Packages are marked as external and not bundled.
     */

    packages: PackagesType;
}
