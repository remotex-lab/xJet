/**
 * An enumeration of ANSI color codes used for text formatting in the terminal.
 *
 * These colors can be used to format terminal output with various text colors,
 * including different shades of gray, yellow, and orange, among others.
 *
 * Each color code starts with an ANSI escape sequence (`\u001B`), followed by the color code.
 * The `Reset` option can be used to reset the terminal's text formatting back to the default.
 *
 * @example
 * ```typescript
 * console.log(Color.BrightPink, 'This is bright pink text', Color.Reset);
 * ```
 */

export const enum Colors {
    reset = '\u001B[0m',
    red = '\u001B[38;5;9m',
    gray = '\u001B[38;5;243m',
    cyan = '\u001B[38;5;81m',
    darkGray = '\u001B[38;5;238m',
    lightCoral = '\u001B[38;5;203m',
    lightOrange = '\u001B[38;5;215m',
    oliveGreen = '\u001B[38;5;149m',
    burntOrange = '\u001B[38;5;208m',
    lightGoldenrodYellow = '\u001B[38;5;221m',
    lightYellow = '\u001B[38;5;230m',
    canaryYellow = '\u001B[38;5;227m',
    deepOrange = '\u001B[38;5;166m',
    lightGray = '\u001B[38;5;252m',
    brightPink = '\u001B[38;5;197m'
}
/**
 * Formats a message string with the specified ANSI color and optionally resets it after the message.
 *
 * This function applies an ANSI color code to the provided message,
 * and then appends the reset code to ensure that the color formatting doesn't extend beyond the message.
 * It's useful for outputting colored text in a terminal. If color formatting is not desired,
 * the function can return the message unformatted.
 *
 * @param color - The ANSI color code to apply. This is used only if `activeColor` is true.
 * @param msg - The message to be formatted with the specified color.
 * @param activeColor - A boolean flag indicating whether color formatting should be applied. Default is `__ACTIVE_COLOR`.
 *
 * @returns {string} A string with the specified color applied to the message,
 * followed by a reset sequence if `activeColor` is true.
 *
 * @example
 * ```typescript
 * const coloredMessage = setColor(Colors.LightOrange, 'This is a light orange message');
 * console.log(coloredMessage);
 * ```
 *
 * @example
 * ```typescript
 * const plainMessage = setColor(Colors.LightOrange, 'This is a light orange message', false);
 * console.log(plainMessage); // Output will be without color formatting
 * ```
 */

export function setColor(color: Colors, msg: string, activeColor: boolean = false): string {
    if (!activeColor)
        return msg;

    return `${color}${msg}${Colors.reset}`;
}

