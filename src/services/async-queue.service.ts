/**
 * Import will remove at compile time
 */

import type { TaskInterface } from '@services/interfaces/async-queue-service.inteface';

/**
 * A service that manages an asynchronous task queue with concurrency control
 *
 * @since 1.0.0
 */

export class AsyncQueueService {
    /**
     * Controls whether the queue processing is active or paused
     * @since 1.0.0
     */

    private paused = true;

    /**
     * Tracks the number of tasks currently being executed
     * @since 1.0.0
     */

    private activeCount = 0;

    /**
     * Maximum number of tasks that can execute concurrently
     * @since 1.0.0
     */

    private readonly concurrencyLimit: number;

    /**
     * Contains the pending tasks waiting to be processed
     * @since 1.0.0
     */

    private queue: Array<TaskInterface> = [];

    /**
     * Creates a new async queue with the specified concurrency limit
     *
     * @param concurrencyLimit - Maximum number of tasks that can run simultaneously
     *
     * @since 1.0.0
     */

    constructor(concurrencyLimit: number) {
        this.concurrencyLimit = concurrencyLimit > 0 ? concurrencyLimit : 1;
    }

    /**
     * The current number of tasks waiting in the queue
     *
     * @returns The number of queued tasks
     *
     * @since 1.0.0
     */

    get size(): number {
        return this.queue.length;
    }

    /**
     * The current number of actively executing tasks
     *
     * @returns The number of running tasks
     *
     * @since 1.0.0
     */

    get running(): number {
        return this.activeCount;
    }

    /**
     * Indicates whether the queue is currently paused
     *
     * @returns True if the queue is paused, false otherwise
     *
     * @since 1.0.0
     */

    get isPaused(): boolean {
        return this.paused;
    }

    /**
     * Stops the queue from processing new tasks
     *
     * @remarks
     * This does not cancel tasks that are already running
     *
     * @since 1.0.0
     */

    stop(): void {
        this.paused = true;
    }

    /**
     * Starts or resumes processing tasks in the queue
     *
     * @remarks
     * If the queue is already running, this method has no effect
     *
     * @since 1.0.0
     */

    start(): void {
        if (this.paused) {
            this.paused = false;
            // Start processing queue tasks again
            this.processQueue();
        }
    }

    /**
     * Removes all pending tasks from the queue
     *
     * @returns The number of tasks that were removed from the queue
     *
     * @remarks
     * This does not affect tasks that are already running
     *
     * @since 1.0.0
     */

    clear(): number {
        const count = this.queue.length;

        // Reject all pending promises before clearing the queue
        this.queue.forEach(taskItem => {
            // Assuming you store resolve/reject functions in the TaskInterface
            // You'll need to modify your TaskInterface and enqueue method to store these
            if ('reject' in taskItem) {
                taskItem.reject();
            }
        });

        this.queue = [];

        return count;
    }

    /**
     * Adds a new task to the queue and returns a promise that resolves with the task result
     *
     * @param task - A function that returns a promise representing the asynchronous task to execute
     * @param runnerId - Optional identifier to associate this task with a specific runner
     * @returns A promise that resolves with the task result or rejects with any error thrown
     *
     * @throws Error - If the task execution fails
     *
     * @remarks
     * Tasks are executed in the order they are added when concurrency allows.
     * Providing a runnerId allows tasks to be removed as a group if needed.
     *
     * @example
     * ```ts
     * const queue = new AsyncQueueService(2);
     * queue.start();
     *
     * // Add tasks to the queue with a runner ID
     * const result1 = await queue.enqueue(
     *   async () => {
     *     const response = await fetch('https://api.example.com/data');
     *     return response.json();
     *   },
     *   'runner-123'
     * );
     * ```
     *
     * @since 1.0.0
     */

    enqueue<T>(task: () => Promise<T>, runnerId?: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Wrap the task to handle its completion
            const wrappedTask = async() => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeCount--;
                    this.processQueue();
                }
            };

            this.queue.push({ task: wrappedTask, runnerId, reject, resolve });
            if (!this.paused) {
                this.processQueue();
            }
        });
    }

    /**
     * Removes all pending tasks associated with a specific runner from the queue
     *
     * @param runnerId - The unique identifier of the runner whose tasks should be removed
     * @returns The number of tasks that were removed from the queue
     *
     * @remarks
     * This is useful for stopping execution of all remaining tests when a critical error occurs in a specific test runner.
     * This does not affect tasks that are already running.
     *
     * @example
     * ```ts
     * // When a fatal error is encountered in a test runner
     * try {
     *   await runTest();
     * } catch (error) {
     *   // Remove all pending tasks for this runner
     *   queue.removeTasksByRunner(runnerId);
     *   console.error('Fatal error occurred, remaining tests canceled');
     * }
     * ```
     *
     * @since 1.0.0
     */

    removeTasksByRunner(runnerId: string): number {
        const initialCount = this.queue.length;
        this.queue = this.queue.filter(item => item.runnerId !== runnerId);

        return initialCount - this.queue.length;
    }

    /**
     * Processes the next task in the queue if concurrency limits allow
     *
     * @remarks
     * This method is called automatically when tasks complete or new tasks are added
     *
     * @since 1.0.0
     */

    private processQueue() {
        if (this.paused) {
            return;
        }

        while (this.activeCount < this.concurrencyLimit && this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                this.activeCount++;
                item.task();
            }
        }
    }
}
