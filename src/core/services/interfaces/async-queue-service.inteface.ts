/**
 * A service that manages an asynchronous task queue with concurrency control
 *
 * @since 1.0.0
 */

export interface TaskInterface {
    task: () => Promise<unknown>;
    runnerId?: string;
}
