/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { MessageHandler } from '../handler/message.handler';
import { AsyncQueueService } from '@services/async-queue.service';

/**
 * Abstract base class that provides core adapter functionality for test execution
 * and message handling.
 *
 * @since 1.0.0
 */

export abstract class BaseAdapter {
    /**
     * Queue service that manages asynchronous execution of tasks.
     * @since 1.0.0
     */

    protected readonly queue: AsyncQueueService;

    /**
     * Handler responsible for processing messages from test executions.
     * @since 1.0.0
     */

    protected readonly messageHandler: MessageHandler;

    /**
     * Map tracking currently running test suites with their resolver functions.
     * @since 1.0.0
     */

    protected readonly runningSuites: Map<string, FunctionType> = new Map();

    /**
     * Creates a new instance of the BaseAdapter.
     *
     * @param config - Configuration settings for the adapter
     *
     * @since 1.0.0
     */

    constructor(protected config: ConfigurationInterface) {
        this.queue = new AsyncQueueService(this.config.parallel);
        this.messageHandler = new MessageHandler(this.completeTask.bind(this));
    }

    /**
     * Gets the current number of active tasks in the queue.
     *
     * @returns The count of currently active tasks
     *
     * @since 1.0.0
     */

    get numberActiveTask(): number {
        return this.queue.size;
    }

    /**
     * Initializes the adapter with required setup configurations.
     *
     * @returns A promise that resolves when initialization is complete
     *
     * @since 1.0.0
     */

    abstract initAdapter(): Promise<void>;

    /**
     * Executes the provided test suites through the adapter.
     *
     * @param suites - Collection of test suites to execute
     * @returns A promise that resolves when all suites have completed execution
     *
     * @since 1.0.0
     */

    abstract executeSuites(suites: TranspileFileTypes): Promise<void>;

    /**
     * Dispatches data to the message handler for processing.
     *
     * @param data - Buffer containing message data to be processed
     *
     * @since 1.0.0
     */

    protected dispatch(data: Buffer): void {
        this.messageHandler.processData(data);
    }

    /**
     * Generates a unique identifier for tracking test suite executions.
     *
     * @returns A random string identifier
     *
     * @remarks This implementation combines two random strings to minimize collision probability
     *
     * @example
     * ```ts
     * const id = adapter.generateId();
     * // Returns something like "f8j2m1n3k5l7p9"
     * ```
     *
     * @since 1.0.0
     */

    protected generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Completes a running task identified by its ID.
     *
     * @param id - Unique identifier of the task to complete
     *
     * @remarks This method resolves the promise associated with the task and removes it from tracking
     *
     * @since 1.0.0
     */

    protected completeTask(id: string): void {
        const resolve = this.runningSuites.get(id);
        if (resolve) {
            resolve();
            this.runningSuites.delete(id);
        }
    }
}
