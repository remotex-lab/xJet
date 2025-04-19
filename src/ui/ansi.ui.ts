/**
 * Imports
 */

import { stdout } from 'process';

/**
 * Generates an ANSI escape sequence to move the terminal cursor to the specified position
 *
 * @param row - The row (line) number to move the cursor to (1-based index)
 * @param column - The column position to move the cursor to (1-based index)
 *
 * @returns ANSI escape sequence string that moves the cursor when written to the terminal
 *
 * @example
 * ```ts
 * // Move cursor to the beginning of line 5
 * const escapeSequence = moveCursor(5, 1);
 * process.stdout.write(escapeSequence);
 * ```
 *
 * @since 1.0.0
 */

export function moveCursor(row: number, column: number = 0): string {
    return `\x1b[${ row };${ column }H`;
}

/**
 * Writes raw data directly to the standard output stream without any processing
 *
 * @param data - The string or Buffer to write to stdout
 *
 * @returns Nothing
 *
 * @example
 * ```ts
 * // Write an ANSI escape sequence followed by text
 * writeRaw('\x1b[31mThis text is red\x1b[0m');
 * ```
 *
 * @since 1.0.0
 */

export function writeRaw(data: string | Buffer): void {
    stdout.write(data);
}
