/**
 * Import will remove at compile time
 */

import type {
    esBuildErrorInterfaces,
    esBuildAggregateErrorInterface
} from '@errors/interfaces/esbuild-error.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { Colors, setColor } from '@components/colors.component';
import { formatCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

/**
 * Represents a collection of ESBuild errors with formatted output
 *
 * @remarks
 * ESBuildError provides a way to handle ESBuild compilation errors and format them
 * with syntax highlighting, proper error location indicators, and formatted stack traces.
 * The error messages are color-coded for better readability in terminal output.
 *
 * @example
 * ```ts
 * try {
 *   // Some build operation
 *   await build();
 * } catch (error) {
 *   throw new esBuildError(error);
 * }
 * ```
 *
 * @extends BaseError
 * @since 1.0.0
 */

export class esBuildError extends BaseError {
    /**
     * Creates a new esBuildError instance
     *
     * @param error - ESBuild error object containing compilation errors
     *
     * @remarks
     * The constructor accepts an error object from ESBuild and processes it based on its structure.
     * If the error contains aggregateErrors, it formats them using the formatAggregateErrors method.
     * Otherwise, it reformats the stack trace directly using the parent class functionality.
     *
     * @example
     * ```ts
     * try {
     *   await esbuild.build(options);
     * } catch (error) {
     *   throw new esBuildError(error);
     * }
     * ```
     *
     * @since 1.0.0
     */

    constructor(error: esBuildErrorInterfaces) {
        super('esBuildError', 'esBuildError build failed');

        this.name = 'ESBuildError';
        this.stack = error.stack;
        if (error.aggregateErrors) this.formatAggregateErrors(error.aggregateErrors);
        else this.reformatStack(error, true);
    }

    /**
     * Formats the provided array of ESBuild errors into a detailed error stack
     * string which includes error descriptions, highlights, and file location details.
     *
     * @param errors - An array of esBuildAggregateErrorInterface objects representing the errors to be formatted.
     * @returns void - This method modifies the `formattedStack` property of the class.
     *
     * @remarks
     * This method processes each error in the array and builds a formatted stack trace that includes:
     * - The error text and associated notes
     * - Syntax-highlighted code snippet where the error occurred
     * - File path and line/column information for error location
     *
     * The formatted output uses color coding to enhance readability in terminal environments.
     *
     * @private
     * @see esBuildAggregateErrorInterface
     * @since 1.0.0
     */

    private formatAggregateErrors(errors: Array<esBuildAggregateErrorInterface>) {
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
