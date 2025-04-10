/**
 * Import will remove at compile time
 */

import type { PromiseResolveType, PromiseRejectType } from '@interfaces/function.interface';

/**
 * A service that manages an asynchronous task queue with concurrency control
 *
 * @since 1.0.0
 */

export interface TaskInterface<T = never> {
    task: () => Promise<unknown>;
    runnerId?: string;
    reject: PromiseRejectType;
    resolve: PromiseResolveType<T>;
}
