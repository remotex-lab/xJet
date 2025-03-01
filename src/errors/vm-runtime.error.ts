/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@errors/interfaces/error.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * Represents a Virtual Machine Runtime Error with source map support.
 * Extends the BaseError class to handle runtime errors that occur during VM execution.
 *
 * @remarks
 * VMRuntimeError is specifically designed to handle runtime errors that occur within a virtual machine context.
 * It provides source map integration for accurate error reporting and stack trace formatting.
 *
 * @example
 * ```typescript
 * try {
 *   // VM operation that might fail
 * } catch (error) {
 *   throw new VMRuntimeError(error, sourceMapService);
 * }
 * ```
 *
 * @since 1.0.0
 */

export class VMRuntimeError extends BaseError {
    /**
     * Creates a new instance of VMRuntimeError.
     *
     * @param originalError - The original error object that was caught
     * @param sourceMap - Source map service for stack trace mapping
     *
     * @remarks
     * The constructor captures the stack trace, sets the error name to 'VMRuntimeError',
     * and reformats the stack trace using the provided source map.
     *
     * @since 1.0.0
     */

    constructor(originalError: ErrorType & BaseError, sourceMap: SourceService) {
        // Pass the message to the base class Error
        super(originalError.message, sourceMap);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VMRuntimeError);
        }

        // Assign the name of the error
        this.name = 'VMRuntimeError';
        originalError.sourceMap = sourceMap;
        this.reformatStack(originalError, false);
    }
}
