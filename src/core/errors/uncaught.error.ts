/**
 * Sets up a global handler for uncaught exceptions in Node.js
 *
 * @param error - The error object representing the uncaught exception
 *
 * @throws Error - This handler itself doesn't throw but catches uncaught exceptions
 *
 * @remarks
 * When an uncaught exception occurs, this handler logs the error to the console
 * and then terminates the process with exit code 1, indicating failure.
 *
 * @example
 * ```ts
 * // This code is automatically registered when the file is loaded
 * // Any uncaught exception will be handled by this handler:
 * throw new Error('This error will be logged and exit the process');
 * ```
 *
 * @see process.exit
 * @see {@link https://nodejs.org/api/process.html#event-uncaughtexception | Node.js documentation on 'uncaughtException'}
 *
 * @since 1.0.0
 */

process.on('uncaughtException', (error: Error) => {
    console.error(error);
    process.exit(1);
});

/**
 * Sets up a global handler for unhandled promise rejections in Node.js
 *
 * @param reason - The error object representing the reason for the promise rejection
 *
 * @throws Error - This handler itself doesn't throw but catches unhandled rejections
 *
 * @remarks
 * When a promise rejection occurs that isn't caught, this handler logs the error
 * to the console and terminates the process with exit code 2, indicating failure.
 * Using a different exit code from uncaught exceptions allows distinguishing
 * between these two types of errors.
 *
 * @example
 * ```ts
 * // This code is automatically registered when the file is loaded
 * // Any unhandled promise rejection will be handled by this handler:
 * Promise.reject(new Error('This rejection will be logged and exit the process'));
 * ```
 *
 * @see process.exit
 * @see {@link https://nodejs.org/api/process.html#process_event_unhandledrejection | Node.js documentation on 'unhandledRejection' }
 *
 * @since 1.0.0
 */

process.on('unhandledRejection', (reason: Error) => {
    console.error(reason);
    process.exit(2);
});

