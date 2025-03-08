/**
 * Interface representing the available command-line options for a CLI application.
 *
 * @remarks
 * This interface defines the structure of the possible options that can be
 * passed to the CLI application to customize its behavior and execution.
 *
 * @since 1.0.0
 */

/**
 * Defines the command-line options available for configuring the CLI application behavior.
 *
 * @remarks
 * This interface specifies optional flags and parameters that customize how the application runs. Options include
 * test filtering, configuration loading, verbosity control, reporting settings, and more.
 *
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */
export interface CliOptionsInterface {
    /**
     * Seed value used for randomizing test execution order.
     * @since 1.0.0
     */

    seed?: number;

    /**
     * Stops test execution immediately upon encountering a failure.
     * @since 1.0.0
     */

    bail?: boolean;

    /**
     * Enables watch mode, re-running tests on file changes.
     * @since 1.0.0
     */

    watch?: boolean;

    /**
     * Glob patterns for files to include in test execution.
     * @since 1.0.0
     */

    files?: string[];

    /**
     * Suppresses all output logs during execution.
     * @since 1.0.0
     */

    silent?: boolean;

    /**
     * Specifies one or more test suites to run.
     * @since 1.0.0
     */

    suites?: string[];

    /**
     * Automatically updates snapshot assertions.
     * @since 1.0.0
     */

    update?: boolean;

    /**
     * Path to a custom configuration file to load.
     * @since 1.0.0
     */

    config?: string;

    /**
     * Filters tests by matching names or patterns.
     * @since 1.0.0
     */

    filter?: string;

    /**
     * Defines the maximum execution time allowed per test, in milliseconds.
     * @since 1.0.0
     */

    timeout?: number;

    /**
     * Enables detailed logging and diagnostic output.
     * @since 1.0.0
     */

    verbose?: boolean;

    /**
     * Watch all files for changes, regardless of changing files.
     * @since 1.0.0
     */

    watchAll?: boolean;

    /**
     * Specifies the reporter to format test results.
     * @since 1.0.0
     */

    reporter?: string;

    /**
     * Enables test coverage reporting.
     * @since 1.0.0
     */

    coverage?: boolean;
}
