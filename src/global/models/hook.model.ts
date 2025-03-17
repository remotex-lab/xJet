/**
 * Import will remove at compile time
 */

import type { ContextType, FunctionType } from '@interfaces/function.interface';
import type { CallbackHandlerType } from '@global/models/interfaces/hook-model.interface';
import type { InvocationLocationInterface } from '@global/components/interfaces/location-component.interface';

/**
 * Imports
 */
import { isPromise } from '@components/promise.component';
import { TimeoutError } from '@global/errors/timeout.error';

/**
 * Represents a model for managing and executing hook functions with a specified timeout.
 * Provides functionality for associating invocation locations and handling errors during execution.
 *
 * @remarks
 * This class ensures that hooks are executed with proper timeout enforcement,
 * and supports both synchronous and asynchronous hook functions.
 * It throws an error if an asynchronous hook
 * incorrectly uses a "done" callback or if it fails to complete execution within the specified timeout.
 *
 * @since 1.0.0
 */

export class HookModel {
    /**
     * Represents the current location of an invocation within the application or a fallback to undefined.
     *
     * @remarks
     * This variable is designed
     * to hold the interface representing the invocation's location for tracking.
     * If no invocation location is available, it defaults to undefined.
     *
     * @since 1.0.0
     */

    private location: InvocationLocationInterface | undefined;

    /**
     * Constructs an instance of the class.
     *
     * @param hookFunction - The callback function that will be executed based on specific conditions.
     * @param timeout - The time in milliseconds before the callback function is triggered.
     * @throws Will throw an error if the provided timeout value is negative or invalid.
     *
     * @remarks This constructor sets up the necessary callback function and timeout configuration for the instance.
     *
     * @since 1.0.0
     */

    constructor(private readonly hookFunction: CallbackHandlerType, private readonly timeout: number) {
        this.location = undefined;
    }

    /**
     * Sets the location of the invocation based on the provided location object.
     *
     * @param location - An object implementing the `InvocationLocationInterface` or `undefined`
     *                   to reset the location.
     *
     * @remarks
     * This method assigns a new location value to the current location of the invocation.
     * Passing `undefined` will clear the current location.
     *
     * @since 1.0.0
     */

    setLocation(location: InvocationLocationInterface | undefined): void {
        this.location = location;
    }

    /**
     * Executes a hook function with a timeout mechanism.
     *
     * @param context - The context object passed to the hook function, containing execution-specific information.
     * @return A promise that resolves when the hook function completes its execution successfully.
     *
     * @throws TimeoutError - If the hook function does not call `done()` within the specified timeout duration.
     *
     * @remarks This method concurrently runs the hook function and a timeout check, ensuring that execution does not
     * exceed the predefined timeout.
     * If the timeout is reached without the hook function completing, a `TimeoutError` is thrown.
     *
     * @since 1.0.0
     */

    async execute(context: ContextType<unknown>): Promise<void> {
        await Promise.race([
            this.executeHook(this.hookFunction, context),
            new Promise((_, reject) =>
                setTimeout(() => reject(
                    new TimeoutError(this.timeout, 'hook while waiting for \'done()\' to be called.', this.location)
                ), this.timeout)
            )
        ]);
    }

    /**
     * Executes a given hook function, handling both synchronous and asynchronous hooks,
     * with or without a callback mechanism.
     *
     * @param hook - The function representing the hook to be executed.
     * It Can be a synchronous or asynchronous function.
     * @param context - An object to be used as the `this` context
     *                  when invoking the hook function.

     * @remarks This method ensures correct execution and error handling
     *          for both callback-based and promise-based hooks.
     *
     * @since 1.0.0
     */

    private async executeHook(hook: FunctionType, context: unknown): Promise<void> {
        if (isPromise(hook) && hook.length > 0)
            throw new Error(`Async hook '${ hook.name }' should not use 'done' callback.`);

        if (hook.length > 0) {
            await new Promise<void>((resolve, reject) => {
                hook.call(context, (error?: string | { message: string }): void => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await hook.call(context);
        }
    }
}
