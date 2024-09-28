/**
 * Represents a callback function that takes no arguments and returns void or undefined.
 *
 * This allows for use in both synchronous and async-like scenarios where returning `undefined`
 * is sufficient, and avoids the need to return `Promise.resolve()`.
 */

export type VoidCallback = () => void | undefined;

/**
 * Represents a callback function that takes any number of arguments and returns void or undefined.
 *
 * This is useful for callbacks that accept parameters but may not require a return value,
 * or return `undefined` in async-like scenarios without returning a Promise.
 */

export type ArgsVoidCallback<T = any> = ((...args: Array<T>) => void | undefined);

/**
 * Represents an asynchronous callback function that takes no arguments
 * and returns a Promise that resolves to void.
 */

export type AsyncVoidCallback = () => PromiseLike<void>;

/**
 * Represents an asynchronous callback function that takes any number of arguments
 * and returns a Promise that resolves to void.
 */

export type AsyncArgsVoidCallback<T = any> = ((...args: Array<T>) => PromiseLike<void>);

/**
 * A callback function executed when a task is complete.
 * Typically used in testing frameworks to indicate the completion of a task.
 * If a message is provided, it indicates that the task finished with an error
 * and the message can be surfaced in a test failure report.
 *
 * @param message - An optional message indicating an error occurred.
 *
 * @example
 * beforeAll((done) => {
 *   // Setup code...
 *   done(); // Call the done callback to indicate completion.
 * });
 */

export type DoneCallback = (message?: string) => void;

/**
 * A type representing a function that provides a callback.
 *
 * It can be one of two forms:
 *
 * 1. **Synchronous:** A function that accepts a `DoneCallback` and optionally returns `void` or `undefined`.
 * 2. **Asynchronous:** An `AsyncEmptyFunction`, which is a function that returns a `Promise<void>`.
 *
 * @example
 * // Synchronous example:
 * const provideCallbackSync: CallbackHandler = (cb) => {
 *   // Do some work...
 *   cb(); // Call the callback when done.
 * };
 *
 * // Asynchronous example:
 * const provideCallbackAsync: CallbackHandler = async () => {
 *   // Do some async work...
 *   await somePromise();
 * };
 */

export type CallbackHandler = ((cb: DoneCallback) => void | undefined) | AsyncVoidCallback;

/**
 * Represents a callback function that can accept either no arguments or any number of arguments,
 * returning either `void` or `undefined`. This type is useful in scenarios where the callback
 * might be invoked without any parameters or with parameters that do not need to produce a
 * return value.
 *
 * It combines the characteristics of both `VoidCallback` and `ArgsVoidCallback`, allowing for
 * greater flexibility in callback usage.
 *
 * - **VoidCallback**: A function that takes no arguments and returns `void` or `undefined`.
 * - **ArgsVoidCallback**: A function that takes any number of arguments and also returns
 *   `void` or `undefined`.
 *
 * This type can be utilized in various contexts, such as event handlers, asynchronous operations,
 * or functions that can be called with varying parameters.
 *
 * @example
 * // Example of a FlexibleVoidCallback that takes no arguments
 * const noArgsCallback: FlexibleVoidCallback = () => {
 *     console.log('No arguments provided.');
 * };
 *
 * // Example of a FlexibleVoidCallback that takes multiple arguments
 * const withArgsCallback: FlexibleVoidCallback = (...args: any[]) => {
 *     console.log('Arguments received:', args);
 * };
 */

export type FlexibleVoidCallback = VoidCallback | ArgsVoidCallback;
