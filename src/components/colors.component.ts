/**
 * Enum representing a collection of ANSI color codes.
 * These color codes can be used to style text in terminal output.
 *
 * @remarks
 * Each color is represented as an ANSI escape code string, allowing
 * terminal applications to apply text formatting such as colors.
 *
 * @since 1.0.0
 */

export const enum Colors {
    Reset = '\u001B[0m',
    Red = '\u001B[38;5;9m',
    Gray = '\u001B[38;5;243m',
    Cyan = '\u001B[38;5;81m',
    DarkGray = '\u001B[38;5;238m',
    LightCoral = '\u001B[38;5;203m',
    LightOrange = '\u001B[38;5;215m',
    OliveGreen = '\u001B[38;5;149m',
    BurntOrange = '\u001B[38;5;208m',
    LightGoldenrodYellow = '\u001B[38;5;221m',
    LightYellow = '\u001B[38;5;230m',
    CanaryYellow = '\u001B[38;5;227m',
    DeepOrange = '\u001B[38;5;166m',
    LightGray = '\u001B[38;5;252m',
    BrightPink = '\u001B[38;5;197m'
}

/**
 * Sets the specified color for the provided message if the `activeColor` flag is true.
 *
 * @param color - The color code to be applied to the message.
 * @param msg - The message to which the color will be applied.
 * @param activeColor - A flag indicating whether the color should be applied, Defaults to true.
 * @return The message, either with the specified color applied or unchanged if `activeColor` is false.
 *
 * @remarks This function appends a reset color code (`Colors.Reset`) to ensure the color formatting ends after the message.
 *
 * @since 1.0.0
 */

export function setColor(color: Colors, msg: string, activeColor: boolean = true): string {
    if (!activeColor)
        return msg;

    return `${color}${msg}${Colors.Reset}`;
}

