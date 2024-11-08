/**
 * Import will remove at compile time
 */

import type { ReporterInterface } from '@reports/interfaces/report.interface';

/**
 * Defines the methods for a custom test reporter.
 *
 * This interface provides the necessary methods to create a custom reporter for test suites and individual tests.
 * It allows tracking of the lifecycle of suites and tests, handling nested suite structures, and reporting on test results.
 */

export const defaultReporter: ReporterInterface = {
    /**
     * Called when a test suite starts.
     *
     * This method is invoked when a suite begins execution. It receives the suite's name along with the
     * list of its parent suites, allowing the reporter to track and display the full path of the suite
     * in a nested hierarchy.
     *
     * @param suiteName - The name of the test suite that is starting.
     * @param parentSuites - An array of names representing the parent suites in the current hierarchy.
     *                       This allows the reporter to handle nested suites by including the full suite path.
     *
     * Example:
     * - If the test suite is "Test Suite A" within "Parent Suite", the `parentSuites` would be `['Parent Suite']`.
     * - The reporter can combine the `parentSuites` with the `suiteName` to display "Parent Suite > Test Suite A".
     */

    onSuiteStart(suiteName: string, parentSuites: Array<string>): void {

    },

    /**
     * Called when a test suite ends.
     *
     * This method is invoked when a test suite finishes execution. It provides the suite's name along with
     * the results of the suite, which can be used by the reporter to display or process the final status of
     * the suite (e.g., passed, failed, or skipped).
     *
     * @param suiteName - The name of the test suite that has completed.
     * @param results - An array containing the results for the suite. Each result represents the outcome of a test
     *                  within the suite, which can include information such as success, failure, or any error encountered.
     *
     * Example:
     * - If "Test Suite A" finishes execution and all tests pass, the `results` array could contain details like:
     *   ```
     *   [{ status: 'passed', testName: 'Test 1' }, { status: 'passed', testName: 'Test 2' }]
     *   ```
     * - If there are failures, the results would include additional information such as error messages.
     */

    onSuiteEnd(suiteName: string, results: Array<unknown>): void {

    },

    /**
     * Called when an individual test starts.
     *
     * This method is invoked when a single test starts execution. It can be used to track individual test lifecycles
     * and output any preliminary information before the test finishes.
     *
     * @param testName - The name of the test that is starting.
     */

    onTestStart(testName: string): void {

    },

    /**
     * Called when an individual test ends.
     *
     * This method is invoked when a single test finishes execution. It allows the reporter to process or display
     * the result of the test.
     *
     * @param testName - The name of the test that has completed.
     * @param result - The result of the test, which could include success, failure, or any other test outcome.
     */

    onTestEnd(testName: string, result: unknown): void {

    },

    /**
     * Called at the end of all tests to report summary information.
     *
     * This method is called once all tests have finished running. It provides an opportunity to report overall
     * statistics or any final messages that summarize the results of the test suite execution.
     */

    onComplete(): void {

    }
};
