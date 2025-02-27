/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@errors/interfaces/error.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

export class VMRuntimeError extends BaseError {
    constructor(originalError: ErrorType, sourceMap?: SourceService) {
        // Pass the message to the base class Error
        super(originalError.message, sourceMap);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VMRuntimeError);
        }

        // Assign the name of the error
        this.name = 'VMRuntimeError';
    }
}
