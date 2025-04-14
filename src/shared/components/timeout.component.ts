/**
 * Import will remove at compile time
 */

import type { FunctionLikeType } from '@interfaces/function.interface';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { TimeoutError } from '@shared/errors/timeout.error';

/**
 * Executes a task with a specified timeout duration and throws an error if the task doesn't complete in time
 *
 * @template T - The return type of the task function
 *
 * @param task - The function to execute with timeout
 * @param delay - The maximum allowed time in milliseconds for the task to complete
 * @param at - The location identifier where the timeout occurred
 * @param location - The execution location information containing position details
 * @returns The result of the task execution if completed within the timeout
 *
 * @throws TimeoutError - When the task execution exceeds the specified delay
 *
 * @remarks
 * This function creates a race condition between the task and a timeout promise.
 * If the task completes before the timeout, the result is returned normally.
 * The timeout is always cleaned up regardless of the task outcome.
 *
 * @example
 * ```ts
 * try {
 *   await withTimeout(
 *     async () => await fetchData(),
 *     5000,
 *     'data-service.fetchUserProfile'
 *   );
 *   console.log('Operation completed successfully');
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.error('Operation timed out');
 *   } else {
 *     console.error('Operation failed:', error);
 *   }
 * }
 * ```
 *
 * @see TimeoutError
 * @see TimeoutPromiseType
 *
 * @since 1.0.0
 */

export async function withTimeout<T>(
    task: FunctionLikeType<T | Promise<T>>, delay: number, at: string, location?: InvocationLocationInterface
) {
    let timeoutID: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutID = setTimeout(() => {
            reject(new TimeoutError(delay, at, location));
        }, delay);
    });

    try {
        await Promise.race([
            task(),
            timeoutPromise
        ]);
    } finally {
        if(timeoutID)
            clearTimeout(timeoutID);
    }
}

