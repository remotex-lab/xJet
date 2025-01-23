/**
 * TestEventType is an enumeration that represents various types of test events.
 * These events signify the stage or outcome of a test execution process.
 *
 * @remarks
 * This enumeration can be used to categorize and handle different statuses or actions
 * typically encountered during the lifecycle of a test case.
 *
 * Enum Values:
 * - `SKIP`: Indicates that the test case was skipped and not executed.
 * - `TODO`: Indicates that the test case is marked as a future implementation.
 * - `START`: Indicates the initiation of the test case execution.
 * - `SUCCESS`: Indicates that the test case has been executed successfully.
 * - `FAILURE`: Indicates that the test case has failed during execution.
 *
 * @since 1.0.0
 */

export const enum TestEventType {
    SKIP,
    TODO,
    START,
    SUCCESS,
    FAILURE
}

/**
 * Enum representing the types of test execution methods available.
 *
 * @remarks
 * This enum defines three different modes of executing tests:
 * - `SYNC`: Synchronous execution, where tests are executed in sequence.
 * - `ASYNC`: Asynchronous execution, where tests are executed using asynchronous logic.
 * - `CALLBACK`: Callback-based execution, where a callback function is used to signal completion.
 *
 * @since 1.0.0
 */

export const enum TestExecutionType {
    SYNC = 'SYNC',
    ASYNC = 'ASYNC',
    CALLBACK = 'CALLBACK'
}
