/**
 * Import will remove at compile time
 */

import type { ESBuildErrorInterface } from '@errors/interfaces/esbuild-error.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { formatCode, highlightCode } from '@remotex-labs/xmap';
import { Colors, setColor } from '@components/colors.component';

/**
 * Represents a collection of ESBuild errors with formatted output
 *
 * @remarks
 * ESBuildsError provides a way to handle multiple ESBuild errors and format them
 * with syntax highlighting, proper error location indicators, and formatted stack traces.
 * The error messages are color-coded for better readability in terminal output.
 *
 * @example
 * ```typescript
 * try {
 *   // Some build operation
 *   await build();
 * } catch (errors) {
 *   if (Array.isArray(errors.errors)) {
 *     throw new ESBuildsError(errors.errors);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

export class ESBuildsError extends BaseError {
    /**
     * Creates a new ESBuildsError instance
     * @param errors - Array of ESBuild errors to process
     *
     * @example
     * ```typescript
     * const errors = [
     *   {
     *     text: 'Could not resolve module',
     *     notes: [{ text: 'Module not found' }],
     *     location: {
     *       file: 'src/index.ts',
     *       line: 10,
     *       column: 15,
     *       lineText: 'import { something } from "missing-module"',
     *       // ... other location properties
     *     }
     *     // ... other error properties
     *   }
     * ];
     *
     * throw new ESBuildsError(errors);
     * ```
     *
     * @since 1.0.0
     */

    constructor(errors: Array<ESBuildErrorInterface>) {
        super('ESBuildsError build failed');

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ESBuildsError);
        }

        this.formatError(errors);
    }

    /**
     * Formats the provided array of ESBuild errors into a detailed error stack
     * string which includes error descriptions, highlights, and file location details.
     *
     * @param errors - An array of ESBuildErrorInterface objects representing the errors to be formatted.
     * @returns A formatted error stack string that includes error messages, code highlights, and file/line details.
     *
     * @remarks This method modifies the `formattedStack` property of the class.
     * Ensure the input array adheres to the `ESBuildErrorInterface` structure.
     *
     * @since 1.0.0
     */

    private formatError(errors: Array<ESBuildErrorInterface>) {
        this.formattedStack = '';

        for (const error of errors) {
            this.formattedStack += `\n${ this.name }: \n${ setColor(Colors.LightCoral, `${ error.text }: ${ error.notes.pop()?.text }`) }\n\n`;
            this.formattedStack += formatCode(highlightCode(error.location.lineText.trim()), {
                startLine: error.location.line
            });

            this.formattedStack += '\n\n';
            this.formattedStack += `at ${ setColor(Colors.DarkGray, error.location.file) } ${
                setColor(Colors.Gray, `[${ error.location.line }:${ error.location.column }]`)
            }\n\n`;
        }
    }
}
