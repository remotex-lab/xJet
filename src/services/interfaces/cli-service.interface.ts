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

    files?: Array<string>;

    /**
     * Suppresses all output logs during execution.
     * @since 1.0.0
     */

    silent?: boolean;

    /**
     * Specifies one or more test suites to run.
     * @since 1.0.0
     */

    suites?: Array<string>;

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

    filter?: Array<string>;

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
     * Specifies the reporter to format test results.
     * @since 1.0.0
     */

    reporter?: string;

    /**
     * Enables test coverage reporting.
     * @since 1.0.0
     */

    coverage?: boolean;

    /**
     * Randomize test execution order.
     * @since 1.0.0
     */

    randomize?: boolean;

    /**
     * Enables banner output
     * @since 1.0.0
     */

    showBanner?: boolean;
}
