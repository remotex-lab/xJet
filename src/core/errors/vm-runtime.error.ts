/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */
import { BaseError } from '@errors/base.error';
import { frameworkProvider } from '@providers/framework.provider';

/**
 * Represents a Virtual Machine Runtime Error with source map support.
 * Extends the BaseError class to handle runtime errors that occur during VM execution.
 *
 * @remarks
 * VMRuntimeError is specifically designed to handle runtime errors that occur within a virtual machine context.
 * It provides source map integration for accurate error reporting and stack trace formatting.
 *
 * @example
 * ```ts
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
     * Contains the errors array for AggregateError instances.
     * Will be undefined for regular errors.
     */

    errors?: Array<VMRuntimeError> = [];

    /**
     * Creates a new instance of VMRuntimeError.
     *
     * @param originalError - The original error object that was caught
     * @param sourceMap - Source map service for stack trace mapping
     * @param includeFramework - Flag to include framework-related files in the output (default: false)
     *
     * @remarks
     * The constructor captures the stack trace, sets the error name to 'VMRuntimeError',
     * and reformats the stack trace using the provided source map.
     *
     * @since 1.0.0
     */

    constructor(private originalError: ErrorType, sourceMap: SourceService, includeFramework = false) {
        if (originalError instanceof BaseError) {
            return <VMRuntimeError> originalError;
        }

        // Pass the message to the base class Error
        super('VMRuntimeError', originalError.message, sourceMap);

        // Handle AggregateError
        if (originalError instanceof AggregateError && Array.isArray(originalError.errors)) {
            // Process nested errors
            this.errors = originalError.errors.map(error =>
                new VMRuntimeError(error as ErrorType, sourceMap, includeFramework)
            );
        }

        originalError.name = 'VMRuntimeError';
        originalError.sourceMap = sourceMap;

        this.stack = originalError.stack;
        this.message = originalError.message;
        this.reformatStack(originalError, includeFramework);
    }

    /**
     * Determines whether the error does not originate from a framework source file.
     *
     * @returns A boolean indicating if the error is not a framework-related error.
     *
     * @remarks
     * This method examines the stack trace and ensures none of the file paths in the call stack
     * originate from known framework sources.
     * For AggregateErrors, it checks each contained error.
     *
     * @example
     * ```ts
     * const errorOrigin = myErrorInstance.isNotFrameworkError();
     * if (errorOrigin) {
     *   console.log("The error is not related to the framework.");
     * }
     * ```
     *
     * @see frameworkProvider.isFrameworkSourceFile
     *
     * @since 1.0.0
     */

    isNotFrameworkError(): boolean {
        // If this is an AggregateError, check each contained error
        if (this.errors && this.errors.length > 0) {
            // Return true if ANY of the contained errors is not a framework error
            return !this.errors.some(error => error.isNotFrameworkError());
        }

        if (!this.originalError.callStacks || this.originalError.callStacks.length === 0) {
            return false;
        }

        return this.originalError.callStacks.some(callStack => {
            const fileName = callStack.getFileName();

            return frameworkProvider.isFrameworkSourceFile(fileName);
        });
    }

    /**
     * Custom Node.js inspection implementation.
     * Enables better error representation when using util.inspect or console.log.
     *
     * @returns The formatted stack trace for display
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')]() {
        if (this.errors && this.errors.length > 0) {
            const errorList = this.errors.map(
                (error) => `${ error.formattedStack ?? error.stack }`
            ).join('');

            return `VMRuntimeError Contains ${ this.errors.length } nested errors:\n${ errorList }\n`;
        }

        return this.formattedStack ?? this.stack;
    }
}
