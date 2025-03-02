/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * Custom error class for xJet-related errors that extends the base error handling functionality.

 * @remarks
 * This error class provides specialized error handling for xJet operations with customizable stack trace formatting.
 *
 * @since 1.0.0
 */

export class xJetError extends BaseError {
    /**
     * Creates a new xJetError instance
     *
     * @param message - The error message to be displayed
     * @param xJetService - Flag to indicate if xJet service formatting should be applied
     *
     * @since 1.0.0
     */

    constructor(message: string, xJetService = false) {
        // Pass the message to the base class Error
        super(message);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, xJetError);
        }

        // Assign the name of the error
        this.name = 'xJetError';
        this.reformatStack(this, xJetService);
    }
}
