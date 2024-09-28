/**
 * An enumeration representing the different statuses a test case or describe block can have.
 *
 * @param TO-DO - Indicates a test case or describe block that is planned but not yet implemented.
 * @param FAILING - Indicates a test case that is expected to fail.
 * @param DEFAULT - Indicates a standard test case or describe block without specific status.
 */

export const enum TestMode {
    TODO,
    FAILING,
    DEFAULT
}

/**
 * An enumeration representing different statuses for test execution.
 *
 * @property START - Test execution has started.
 * @property DONE - Test execution has completed.
 * @property SKIP - Test was skipped.
 * @property TODO - Test is planned but not yet implemented.
 * @property FAILURE - Test execution has failed.
 * @property SUCCESS - Test execution has succeeded.
 */

export const enum TestEventType {
    START,
    SKIP,
    TODO,
    FAILURE,
    SUCCESS,
    HOOK_FAILURE
}
