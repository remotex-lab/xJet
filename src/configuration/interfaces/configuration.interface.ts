/**
 * Import will remove at compile time
 */

import type { ReporterInterface } from '@reports/interfaces/report.interface';
import type { AdapterInit, AdapterRequestType } from '@adapters/interfaces/adapter.interface';

/**
 * Interface representing the configuration options for the Jet tests.
 *
 * This interface defines the configuration options for running the tests, including file patterns, logging settings,
 * test execution modes, and external dependencies. It also specifies the adapter initialization and reporter to be used.
 */

export interface ConfigurationInterface {
    /**
     * Array of glob patterns used to locate test files.
     *
     * Example:
     * ```
     * ['**\/*.test.ts', '**\/*.spec.js']
     * ```
     */

    match: Array<string>;

    /**
     * Enables or disables color output in the test results displayed in the terminal.
     * Set to `true` for colored output or `false` for plain text.
     */

    color: boolean;

    /**
     * The root directory for locating test files. Can be specified as a path
     * string or in glob format to target multiple directories.
     * Example:
     * './tests'` or `'./src/**\/*'
     */

    rootDir: string;

    /**
     * Enables or disables watch mode for test execution. When `true`, tests
     * will re-run automatically upon detecting changes in the files.
     */

    watchMode: boolean;

    /**
     * Sets the logging verbosity level for test output and diagnostic information.
     * Options:
     * - `'silent'`: No output
     * - `'error'`: Errors only
     * - `'warn'`: Warnings and errors
     * - `'info'`: General information, warnings, and errors
     * - `'debug'`: Detailed debugging output, useful for development
     */

    logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';

    /**
     * An array of external packages that should not be bundled with the tests.
     * These packages will be loaded externally, optimizing bundle size.
     * Example: `['lodash', 'react']`
     */

    external: Array<string>;

    /**
     * Specifies how esbuild should handle packages.
     * - `'bundle'`: Packages are bundled with the test code.
     * - `'external'`: Packages are marked as external and not bundled.
     */

    packages: 'bundle' | 'external',

    /**
     * Function to initialize the adapter, executed before tests run.
     */

    adapterInit: AdapterInit;

    /**
     * Sends a request to execute a test suite on a remote system, calling `onResponse` to handle streamed results.
     */

    adapterRequest: AdapterRequestType;

    /**
     * The reporter interface used to report test results.
     * The custom reporter is used to display or process the test execution results in a customized manner.
     */

    reporter: ReporterInterface;
}
