/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { formatStack } from '@components/stack.component';

/**
 * BaseError is an abstract class that extends the built-in Error object.
 * It provides additional capabilities such as source mapping and enhanced stack trace handling.
 *
 * @since 1.0.0
 */

export abstract class BaseError extends Error {
    /**
     * A formatted representation of a stack trace, typically used for debugging purposes.
     *
     * @since 1.0.0
     */

    protected formattedStack: string | undefined;

    /**
     * Represents a mapped reference to the SourceService instance, which may be undefined.
     *
     * @see SourceService
     * @since 1.0.0
     */

    protected map: SourceService | undefined;

    /**
     * Constructs a new instance of the BaseError, initializing name, message, and an optional source map.
     *
     * @param name - The name of the error
     * @param message - A detailed message describing the error
     * @param sourceMap - An optional service for source managing
     *
     * @throws Error - Throws an error if stack trace capturing is not supported
     *
     * @remarks
     * This constructor adds support for optional source mapping and ensures the error stack trace is
     * captured for debugging purposes.
     *
     * @see SourceService
     * @since 1.0.0
     */

    protected constructor(name: string, message: string, sourceMap?: SourceService) {
        super(message);

        this.name = name;
        this.map = sourceMap;
    }

    /**
     * Gets the source map service if available.
     *
     * @returns The source map service or undefined if not provided
     *
     * @see SourceService
     * @since 1.0.0
     */

    get sourceMap(): SourceService | undefined {
        return this.map;
    }

    /**
     * Gets the formatted stack trace.
     *
     * @returns The formatted stack trace string or undefined
     * @since 1.0.0
     */

    get formatStack(): string | undefined {
        return this.formattedStack;
    }

    /**
     * Custom Node.js inspection implementation.
     * Enables better error representation when using util.inspect or console.log.
     *
     * @returns The formatted stack trace for display
     * @since 1.0.0
     */

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.formattedStack ?? this.stack;
    }

    /**
     * Reformats the stack trace of an error and stores it in the formattedStack property.
     *
     * @param error - An instance of the error that includes call stack details.
     * @param includeFramework - Flag to include framework-related files in the output (default: false).
     * @returns void
     *
     * @remarks This method processes the stack trace of the given error object
     * and applies a specific formatting using the `formatStacks` function.
     *
     * @throws ErrorType - If the error object does not include the required `callStacks` property or is malformed.
     *
     * @see formatStacks
     * @since 1.0.0
     */

    protected reformatStack(error: ErrorType, includeFramework = false): void {
        this.formattedStack = formatStack(error, includeFramework);
    }
}
