/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * Represents a standard error in the xJet framework environment.
 * Extends the BaseError class to provide consistent error handling and formatting.
 *
 * @throws xJetError - When instantiated with an error message
 *
 * @remarks
 * xJetError serves as a general-purpose error type within the framework,
 * automatically reformatting stack traces to include framework files for comprehensive debugging.
 *
 * @example
 * ```ts
 * try {
 *   // Some operation that might fail
 *   if (!validCondition) {
 *     throw new xJetError('Operation failed: Invalid condition detected');
 *   }
 * } catch (error) {
 *   console.error(error);
 *   // Handle the error appropriately
 * }
 * ```
 *
 * @see BaseError
 * @since 1.0.0
 */

export class xJetError extends BaseError {
    /**
     * Creates a new instance of xJetError.
     *
     * @param message - Human-readable description of the error
     * @param includeFramework - Flag to include framework-related files in the output (default: true)
     *
     * @remarks
     * The constructor sets the error name to 'xJetError' and automatically
     * reformats the stack trace to include framework files for better debugging.
     *
     * @since 1.0.0
     */

    constructor(message: string, includeFramework = true) {
        // Pass the message to the base class Error
        super('xJetError', message);
        this.reformatStack(this, includeFramework);
    }
}
