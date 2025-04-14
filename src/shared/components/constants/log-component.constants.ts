/**
 * Enumeration of logging levels supported by the structured logging system
 *
 * @remarks
 * This enum defines the severity levels for log messages, matching the
 * standard console methods. The numeric values implicitly represent
 * increasing levels of severity (except for debug which is a special case).
 *
 * Each level corresponds to a console method of the same name, allowing
 * for consistent mapping between console methods and structured log levels.
 *
 * @example
 * ```ts
 * // Creating a log entry with warning level
 * const logEntry = {
 *   level: LogLevel.WARN,
 *   message: "Resource usage high",
 *   timestamp: new Date().toISOString()
 * };
 * ```
 *
 * @see createLogHandler
 * @see ConsoleMethodType
 *
 * @since 1.0.0
 */

export enum LogLevel {
    LOG,
    INFO,
    WARN,
    ERROR,
    DEBUG
}
