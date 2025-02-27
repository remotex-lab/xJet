/**
 * Sets up global error handling for uncaught exceptions in the application.
 *
 * @event process#uncaughtException - Triggered when an uncaught exception occurs
 *
 * @throws Error - Logs the error stack trace to console.error before exiting
 *
 * @remarks
 * Ensures that any uncaught exception is logged before the process exits with code 1.
 *
 * @example
 * ```typescript
 * // This will trigger the uncaughtException handler:
 * throw new Error('Unexpected error');
 * ```
 *
 * @since 1.0.0
 */

process.on('uncaughtException', (error: Error) => {
    console.error(error);
    process.exit(1);
});

/**
 * Sets up global error handling for unhandled promise rejections in the application.
 *
 * @event process#unhandledRejection - Triggered when a promise rejection is not handled
 *
 * @throws Error - Logs the error stack trace to console.error before exiting
 *
 * @remarks
 * Ensures that any unhandled promise rejection is logged before the process exits with code 2.
 *
 * @example
 * ```typescript
 * // This will trigger the unhandledRejection handler:
 * Promise.reject(new Error('Rejected promise'));
 * ```
 *
 * @since 1.0.0
 */

process.on('unhandledRejection', (reason: Error) => {
    console.error(reason);
    process.exit(2);
});
