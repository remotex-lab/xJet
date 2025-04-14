/**
 * Represents the supported console method types for logging
 *
 * @remarks
 * This type defines the subset of console methods that our logging system
 * supports for interception and structured logging. It includes the
 * standard logging levels commonly used in debugging and monitoring.
 *
 * @example
 * ```ts
 * const logMethod: ConsoleMethodType = 'warn';
 * console[logMethod]('This is a warning');
 * ```
 *
 * @see Console
 * @see createLogHandler
 *
 * @since 1.0.0
 */

export type ConsoleMethodType = Uppercase<keyof Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>>;
