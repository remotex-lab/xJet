/**
 * Import will remove at compile time
 */

import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Represents an error that occurs when an operation exceeds its allocated time limit.
 *
 * @remarks
 * The `TimeoutError` class provides error handling for operations that exceed their
 * specified time limits. It captures information about the timeout duration, the
 * operation location, and where in the execution flow the timeout occurred. This
 * specialized error helps distinguish timeout issues from other execution errors
 * in the system.
 *
 * @example
 * ```ts
 * // When a long-running operation exceeds its time limit
 * function executeWithTimeout(fn: () => Promise<void>, timeLimit: number): Promise<void> {
 *   return Promise.race([
 *     fn(),
 *     new Promise((_, reject) => {
 *       setTimeout(() => {
 *         reject(new TimeoutError(timeLimit, 'executeWithTimeout', { line: 42, column: 42 }));
 *       }, timeLimit);
 *     })
 *   ]);
 * }
 * ```
 *
 * @since 1.0.0
 */

export class TimeoutError extends ExecutionError {
    /**
     * Creates a new TimeoutError instance.
     *
     * @param timeout - The duration in milliseconds that was exceeded
     * @param at - Description of where the timeout occurred (e.g., function name, process description)
     * @param location - The execution location information containing position details
     *
     * @remarks
     * Constructs a TimeoutError with a descriptive message including the timeout duration
     * and context. The error captures the location information and maintains a clean stack trace
     * for better debugging.
     *
     * The error is given the distinctive name 'xJetTimeoutError' to easily identify
     * timeout-specific issues in logs and error reports.
     *
     * @since 1.0.0
     */

    constructor(timeout: number, at: string, private readonly location?: InvocationLocationInterface) {
        super(`Exceeded timeout of ${ timeout } ms at ${ at }`);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }

        // Assign the name of the error
        this.name = 'xJetTimeoutError';
    }
}
