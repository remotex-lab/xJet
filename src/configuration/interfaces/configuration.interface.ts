/**
 * Import will remove at compile time
 */

import type { ReporterInterface } from '@reports/interfaces/report.interface';
import type { AdapterInit, AdapterRequestType } from '@adapters/interfaces/adapter.interface';

/**
 * Defines the valid types for specifying how esbuild should handle packages in the testing framework.
 *
 * The value can either be `'bundle'`, which means the package will be bundled with the test code,
 * or `'external'`, meaning the package will not be bundled and will be loaded externally.
 */

export type PackagesType = 'bundle' | 'external';

/**
 * Defines the valid verbosity levels for logging in the testing framework.
 *
 * The log level can be set to control the amount of logging information:
 * - `'silent'`: No output will be shown.
 * - `'error'`: Only errors will be displayed.
 * - `'warn'`: Warnings and errors will be shown.
 * - `'info'`: General information, along with warnings and errors.
 * - `'debug'`: Detailed debugging output will be shown, including all other log levels.
 */

export type LogLevelType = 'silent' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Represents a module with its exports and an optional default export.
 *
 * This interface provides a structure to define and interact with the exports of a module.
 * It includes both named and default exports, where default exports are of a specific type.
 */

export interface ModuleInterface {

    /**
     * An object representing the exports of the module.
     * The keys are strings representing export names, and the values can be of any type.
     *
     * @property {ConfigurationInterface} [default] - An optional default export of type `ConfigurationInterface`.
     */

    exports: {
        [key: string]: unknown;
        default?: ConfigurationInterface;
    };
}

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

    root: string;

    /**
     * Enables or disables watch mode for test execution. When `true`, tests
     * will re-run automatically upon detecting changes in the files.
     */

    watch: boolean;

    /**
     * Sets the logging verbosity level for test output and diagnostic information.
     * Options:
     * - `'silent'`: No output
     * - `'error'`: Errors only
     * - `'warn'`: Warnings and errors
     * - `'info'`: General information, warnings, and errors
     * - `'debug'`: Detailed debugging output, useful for development
     */

    logLevel: LogLevelType;

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

    packages: PackagesType;

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

/**
 * Represents a partial configuration type based on the `ConfigurationInterface`.
 */

export type PartialConfigurationsType = Partial<ConfigurationInterface>;
