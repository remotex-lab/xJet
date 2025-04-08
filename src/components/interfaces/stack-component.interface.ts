/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';

/**
 * Extends the standard Error type with optional source mapping information
 *
 * @see SourceService
 *
 * @since 1.0.0
 */

export type ErrorType = Error & {
    sourceMap?: SourceService
};

/**
 * Defines the context for stack trace processing
 *
 * @param code - The code string to be processed
 * @param error - The error object containing stack information
 * @param activeNative - Indicates whether native stack traces should be included
 * @param includeFramework - Indicates whether framework-related stack traces should be included
 *
 * @since 1.0.0
 */

export interface StackContextInterface {
    code: string;
    line?: number;
    error: ErrorType;
    column?: number;
    formatCode: string;
    activeNative: boolean;
    includeFramework: boolean;
}

/**
 * Interface defining the structure of error results from stack processing
 *
 * @property code - The code snippet where the error occurred
 * @property line - The line number where the error occurred
 * @property column - The column number where the error occurred
 * @property stacks - Formatted stack trace information as a string
 *
 * @since 1.0.0
 */

export interface ErrorResultInterface {
    /**
     * The code snippet where the error occurred
     */

    code: string;

    /**
     * The line number where the error occurred
     */

    line: number;

    /**
     * The column number where the error occurred
     */

    column: number;

    /**
     * Formatted stack trace information as a string
     */

    stacks: string;

    /**
     * Formatted code snippet where the error occurred
     */

    formatCode: string;
}
