/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@errors/interfaces/error.interface';

/**
 * Imports
 */

import { formatStacks } from '@components/stack.component';

/**
 * Stores the original implementation of `Error.prepareStackTrace`.
 *
 * The `prepareStackTrace` function invoked by V8 when generating stack traces.
 * This variable retains the default implementation of `Error.prepareStackTrace`
 * so it can be restored or used at a later time if needed.
 *
 * @remarks
 * Customizing `Error.prepareStackTrace` allows for modifying the structure
 * or content of stack trace output when errors are thrown.
 * Preserving the original value in `originalPrepareStackTrace` ensures that the default
 * behavior is not permanently overwritten.
 *
 * @since 1.0.0
 */

const originalPrepareStackTrace = Error.prepareStackTrace;

/**
 * A function used to customize the stack trace produced when an error is thrown.
 * This allows developers to define their own behavior for stack trace formatting.
 *
 * @param error - The error object for which the stack trace is being generated.
 * @param structuredStackTrace - The structured stack trace that includes information about each call site.
 * @returns A string representing the processed stack trace to be associated with the error.
 *
 * @remarks
 * By default, the `Error.prepareStackTrace` property is `undefined`.
 * Assigning a function to this property customizes how stack traces are generated.
 * This can be useful for error tracking, logging, or debugging.
 * Be cautious when overriding this, as it affects the behavior of all errors throughout the application.
 *
 * @since 1.0.0
 */

Error.prepareStackTrace = (error: ErrorType, stackEntries: Array<NodeJS.CallSite>): string => {
    // Attach the stack entries (CallSite objects) to the error object
    error.callStacks = stackEntries;

    // Call the original prepareStackTrace to return the standard string representation of the stack
    return originalPrepareStackTrace ? originalPrepareStackTrace(error, stackEntries) : '';
};

/**
 * Abstract base class for custom error handling with source map and stack trace support.
 * Extends the native Error class to provide enhanced error reporting capabilities.
 *
 * @remarks
 * The BaseError class serves as a foundation for creating specialized error types
 * with improved stack trace formatting and source map integration.
 * It maintains the original stack trace while providing methods to reformat and customize the error output.
 *
 * @example
 * ```typescript
 * class CustomError extends BaseError {
 *   constructor(message: string, sourceMap?: SourceService) {
 *     super(message, sourceMap);
 *     this.name = 'CustomError';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

export abstract class BaseError extends Error {
    /**
     * Array of call site objects representing the error's stack trace.
     * @since 1.0.0
     */

    readonly callStacks: Array<NodeJS.CallSite> = [];

    /**
     * Optional source map service for stack trace mapping.
     * @since 1.0.0
     */

    protected map: SourceService | undefined;

    /**
     * Formatted stack trace string.
     * @since 1.0.0
     */

    protected formattedStack: string;

    /**
     * Creates a new instance of BaseError.
     *
     * @param message - The error message
     * @param sourceMap - Optional source map service for stack trace mapping
     *
     * @since 1.0.0
     */

    protected constructor(message: string, sourceMap?: SourceService) {
        super(message);

        // Assign the name of the error
        this.name = 'xJetBaseError';
        this.map = sourceMap;
        this.formattedStack = this.stack ?? '';
    }

    /**
     * Gets the current source map service instance.
     *
     * @returns The current SourceService instance or undefined if not set
     *
     * @since 1.0.0
     */

    get sourceMap(): SourceService | undefined {
        return this.map;
    }

    /**
     * Sets the source map service instance.
     *
     * @param map - The SourceService instance to set
     *
     * @since 1.0.0
     */

    set sourceMap(map: SourceService | undefined) {
        this.map = map;
    }

    /**
     * Gets the formatted stack trace.
     *
     * @returns The formatted stack trace string or undefined
     *
     * @since 1.0.0
     */

    get formatStack(): string | undefined {
        return this.formattedStack;
    }

    /**
     * Custom inspection function for Node.js util.inspect().
     * Returns the formatted stack trace when the error is inspected.
     *
     * @returns The formatted stack trace
     *
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.formattedStack;
    }

    /**
     * Reformats the stack trace using the provided error information.
     *
     * @param error - The error object containing call stacks
     * @param xJetService - Flag to indicate if xJet service formatting should be applied
     *
     * @since 1.0.0
     */

    protected reformatStack(error: ErrorType & BaseError, xJetService = false): void {
        if (!error.callStacks)
            return;

        this.formattedStack = formatStacks(error, error.callStacks, xJetService);
    }
}
