/**
 * Import will remove at compile time
 */

import type { InvocationLocationInterface } from '@global/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { BaseError } from '@global/errors/base.error';

/**
 * Represents an error indicating that a timeout occurred during the execution of an operation.
 * This error is typically thrown when an operation surpasses the specified duration limit.
 *
 * @remarks
 * The `TimeoutError` class extends the base `BaseError` class.
 * It provides additional context about the location
 * where the timeout occurred if such contextual information is available.
 *
 * @since 1.0.0
 */

export class TimeoutError extends BaseError {
    /**
     * Represents the location of an invocation in the system or null if the location is undefined.
     *
     * @remarks
     * This variable is used to specify the interface that defines where a specific invocation has occurred.
     * It can either hold an object implementing `InvocationLocationInterface`
     * or null if the location is not applicable or has not been set.
     *
     * @see InvocationLocationInterface
     *
     * @since 1.0.0
     */

    readonly location: InvocationLocationInterface | null;

    /**
     * Constructs a new TimeoutError instance with a specified timeout, location, and optional invocation details.
     *
     * @param timeout - The timeout duration in milliseconds that was exceeded.
     * @param at - A string representing the context or point at which the timeout occurred.
     * @param location - An optional `InvocationLocationInterface`
     * specifying additional details about the function call or location in the code.
     *
     * @remarks This error is specifically used to indicate that a timeout has occurred,
     * providing detailed information about where and when it happened.
     *
     * @since 1.0.0
     */

    constructor(timeout: number, at: string, location: InvocationLocationInterface | null = null) {
        // todo message
        super(`Exceeded timeout of ${ timeout } ms at ${ at }`);
        this.location = location;

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }

        // Assign the name of the error
        this.name = 'xJetTimeoutError';
    }
}
