/**
 * Contains ANSI escape sequence constants for terminal control operations
 *
 * @remarks
 * These ANSI escape codes are used to control terminal output behavior such as
 * cursor movement, screen clearing, and visibility. The enum provides a type-safe
 * way to access these constants without having to remember the raw escape sequences.
 *
 * Each constant is an escape sequence that can be written directly to the terminal
 * to achieve the described effect.
 *
 * @see ShadowRenderer
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 *
 * @since 1.0.0
 */

export const enum ANSIEnum {
    /**
     * Clears from cursor position to the end of the line
     * @since 1.0.0
     */

    CLEAR_LINE = '\x1B[K',

    /**
     * Hides the cursor
     * @since 1.0.0
     */

    HIDE_CURSOR = '\x1B[?25l',

    /**
     * Shows the cursor
     * @since 1.0.0
     */

    SHOW_CURSOR = '\x1B[?25h',

    /**
     * Saves the current cursor position
     * @since 1.0.0
     */

    SAVE_CURSOR = '\x1B[s',

    /**
     * Clears the entire screen and moves cursor to home position
     * @since 1.0.0
     */

    CLEAR_SCREEN = '\x1b[2J\x1b[H',

    /**
     * Restores the cursor to the previously saved position
     * @since 1.0.0
     */

    RESTORE_CURSOR = '\x1B[u',

    /**
     * Clears the screen from the cursor position down and moves cursor to home position
     * @since 1.0.0
     */

    CLEAR_SCREEN_DOWN = '\x1b[0j\x1b[H',
}
