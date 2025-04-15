/**
 * Imports
 */

import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Represents an error thrown when a test marked as failing unexpectedly passes
 *
 * @override
 *
 * @throws Error - If the stack trace cannot be captured properly
 *
 * @remarks
 * This error is thrown during test execution when a test that has been marked with
 * the `.failing` flag successfully completes without errors. This indicates that
 * a test previously expected to fail is now passing and should have its failing
 * flag removed.
 *
 * @example
 * ```ts
 * try {
 *   // Test execution code
 *   if (testOptions.failing && testPassed) {
 *     throw new FailingError();
 *   }
 * } catch (error) {
 *   if (error instanceof FailingError) {
 *     console.log('A test marked as failing unexpectedly passed');
 *   }
 * }
 * ```
 *
 * @see TestCase
 * @see ExecutionError
 *
 * @since 1.0.0
 */

export class FailingError extends ExecutionError {
    /**
     * Constructs a new FailingError instance with a predefined error message
     *
     * @remarks
     * This constructor creates an error with a descriptive message explaining that
     * a test marked as failing unexpectedly passed. It also captures the stack trace
     * for better debugging and sets a specific error name for identification.
     *
     * @example
     * ```ts
     * if (test.options.failing && testPassed) {
     *   throw new FailingError();
     * }
     * ```
     *
     * @see ExecutionError
     *
     * @since 1.0.0
     */

    constructor() {
        super('Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FailingError);
        }

        // Assign the name of the error
        this.name = 'xJetFailingError';
    }
}
