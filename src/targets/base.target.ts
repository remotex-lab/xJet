/**
 * Import will remove at compile time
 */

import type {
    LogSchemaInterface,
    RequiredMessageType,
    ErrorSchemaInterface,
    ActionSchemaInterface,
    StatusSchemaInterface
} from '@schema/interfaces/action-schema.interface';
import type { SourceService } from '@remotex-labs/xmap';
import type { FunctionLikeType, FunctionType } from '@interfaces/function.interface';
import type { runningSuitesInterface } from '@targets/interfaces/base-traget.interface';
import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import EventEmitter from 'events';
import { xJetError } from '@errors/xjet.error';
import { decodeSchema } from '@schema/action.schema';
import { AsyncQueueService } from '@services/async-queue.service';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Abstract base class that provides common functionality for all target implementations
 *
 * @remarks
 * This class serves as a foundation for specific target implementations,
 * defining their common structure and behavior. Concrete target classes
 * should extend this class and implement its abstract methods.
 * The class manages test suite execution, handles event dispatching,
 * and provides queue functionality for controlled parallel execution.
 *
 * @example
 * ```ts
 * class CustomTarget extends BaseTarget {
 *   async initTarget(): Promise<void> {
 *     // Initialize target environment
 *   }
 *
 *   async executeSuites(suites: TranspileFileTypes): Promise<void> {
 *     // Implement suite execution logic
 *   }
 * }
 * ```
 *
 * @see AsyncQueueService
 * @see TranspileFileTypes
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */

export abstract class BaseTarget {
    /**
     * A collection that maps suite identifiers to their corresponding SourceService instances
     *
     * @default new Map()
     * @since 1.0.0
     */

    readonly suites: Map<string, SourceService> = new Map();

    /**
     * Service that manages asynchronous task execution with controlled parallelism
     *
     * @since 1.0.0
     */

    protected readonly queue: AsyncQueueService;

    /**
     * Tracks currently executing test suites with their resolution functions
     *
     * @default new Map()
     * @since 1.0.0
     */

    protected readonly runningSuites: Map<string, runningSuitesInterface> = new Map();

    /**
     * Manages event subscriptions and dispatching within the service
     *
     * @default new EventEmitter()
     * @since 1.0.0
     */

    protected readonly eventEmitter = new EventEmitter();

    /**
     * Creates a new instance with the specified configuration
     *
     * @param config - Configuration settings for the service
     *
     * @see ConfigurationInterface
     * @since 1.0.0
     */

    constructor(protected config: ConfigurationInterface) {
        this.queue = new AsyncQueueService(this.config.parallel);
    }

    /**
     * Returns the current number of active tasks in the queue
     *
     * @returns The count of tasks currently being processed
     * @since 1.0.0
     */

    get numberActiveTask(): number {
        return this.queue.size;
    }

    /**
     * Initializes the target environment for processing
     *
     * @returns A Promise that resolves when initialization is complete
     * @throws InitializationError - When the target environment cannot be initialized
     *
     * @since 1.0.0
     */

    abstract initTarget(): Promise<void>;

    /**
     * Retrieves the name of a runner based on its identifier
     *
     * @param runnerId - The unique identifier of the runner to look up
     * @returns The human-readable name of the specified runner
     *
     * @throws RunnerNotFoundError - When the specified runner ID does not exist
     *
     * @see runningSuitesInterface
     * @since 1.0.0
     */

    abstract getRunnerName(runnerId: string): string;

    /**
     * Executes test suites on the target environment
     *
     * @param suites - Collection of test suite files to be executed
     * @param watchMode - Indicates whether continuous monitoring mode is enabled
     * @returns A Promise that resolves when all suites have been executed
     *
     * @throws ExecutionError - When test suite execution fails
     *
     * @since 1.0.0
     */

    abstract executeSuites(suites: TranspileFileTypes, watchMode?: boolean): Promise<void>;

    /**
     * Registers a listener function for LOG events
     *
     * @param key - The event type to listen for, must be 'LOG'
     * @param listener - Callback function that gets invoked when a LOG event occurs
     * @returns The instance of the current object for chaining
     *
     * @throws EventError - When registration of the event listener fails
     *
     * @see LogSchemaInterface
     *
     * @since 1.0.0
     */

    on(key: 'log', listener: FunctionLikeType<void, [
        RequiredMessageType<LogSchemaInterface>, SourceService
    ]>): this;

    /**
     * Registers a listener function for ERROR events
     *
     * @param key - The event type to listen for, must be 'ERROR'
     * @param listener - Callback function that gets invoked when an ERROR event occurs
     * @returns The instance of the current object for chaining
     *
     * @throws EventError - When registration of the event listener fails
     *
     * @see SourceService
     * @since 1.0.0
     */

    on(key: 'error', listener: FunctionLikeType<void, [
        RequiredMessageType<ErrorSchemaInterface>, SourceService
    ]>): this;

    /**
     * Registers a listener function for ACTION events
     *
     * @param key - The event type to listen for, must be 'ACTION'
     * @param listener - Callback function that gets invoked when an ACTION event occurs
     * @returns The instance of the current object for chaining
     *
     * @throws EventError - When registration of the event listener fails
     *
     * @see ActionSchemaInterface
     * @since 1.0.0
     */

    on(key: 'action', listener: FunctionLikeType<void, [
        RequiredMessageType<ActionSchemaInterface>, SourceService
    ]>): this;

    /**
     * Registers a listener function for FINISH events
     *
     * @param key - The event type to listen for, must be 'FINISH'
     * @param listener - Callback function that gets invoked when a FINISH event occurs with the suite ID
     * @returns The instance of the current object for chaining
     *
     * @throws EventError - When registration of the event listener fails
     *
     * @since 1.0.0
     */

    on(key: 'status', listener: FunctionLikeType<void, [
        RequiredMessageType<StatusSchemaInterface>, SourceService
    ]>): this;

    /**
     * Registers a listener function for the specified event type
     *
     * @param key - The event type to listen for, can be a string or symbol
     * @param listener - Callback function that gets invoked when the specified event occurs
     * @returns The instance of the current object for chaining
     * @throws EventError - When registration of the event listener fails
     *
     * @example
     * ```ts
     * const emitter = new EventEmitter();
     * emitter.on('log', (data) => {
     *   console.log('Received data:', data);
     * });
     * ```
     *
     * @see FunctionType
     * @since 1.0.0
     */

    on(key: string | symbol, listener: FunctionType): this {
        this.eventEmitter.on(key, listener);

        return this;
    }

    /**
     * Completes a test suite's execution with appropriate resolution
     *
     * @param suiteId - Unique identifier for the test suite
     * @param hasError - Whether the suite completed with errors
     * @returns void
     *
     * @throws SuiteExecutionError - When an internal error occurs during suite completion
     *
     * @remarks
     * This method handles suite completion logic based on configuration settings.
     * When a suite has errors and bail is enabled, the promise is rejected.
     * Otherwise, the promise is resolved normally.
     *
     * @example
     * ```ts
     * // Complete a suite successfully
     * this.completeSuite('suite-123');
     *
     * // Complete a suite with error
     * this.completeSuite('suite-456', true);
     * ```
     *
     * @see runningSuitesInterface
     * @see ConfigurationInterface
     *
     * @since 1.0.0
     */

    completeSuite(suiteId: string, hasError = false): void {
        const suiteContext = this.runningSuites.get(suiteId);
        if (!suiteContext) {
            return;
        }

        this.runningSuites.delete(suiteId);
        if (hasError && this.config.bail) {
            this.queue.stop();
            this.queue.clear();
            suiteContext.reject();
        } else {
            suiteContext.resolve();
        }
    }

    /**
     * Processes incoming buffer data by decoding it into a schema and dispatching appropriate events
     *
     * @param buffer - The binary data buffer containing encoded schema information
     *
     * @throws Error - When the buffer cannot be decoded properly
     * @throws xJetError - When a runner is not registered or an invalid schema type is detected
     * @throws VMRuntimeError - When processing the schema data encounters runtime errors
     *
     * @remarks
     * This method handles different types of schema messages including logs, actions, errors, and completion signals.
     * For each type, it emits the corresponding event or takes appropriate action. If an invalid schema type
     * is detected, it emits an ERROR event with details about the invalid schema.
     *
     * @example
     * ```ts
     * const runner = new TestRunner();
     * const messageBuffer = encodeSchema({
     *   type: SchemaType.LOG,
     *   suiteId: 'test-suite-123',
     *   runnerId: 'runner-456',
     *   message: 'Test execution started'
     * });
     * runner.dispatch(messageBuffer);
     * ```
     *
     * @internal
     * @see SchemaType
     * @see decodeSchema
     * @see ErrorSchemaInterface
     *
     * @since 1.0.0
     */

    protected dispatch(buffer: Buffer): void {
        const data = decodeSchema(buffer);
        const source = this.suites.get(data.suiteId);
        if(!source) throw new xJetError(
            `Runner '${ data.runnerId }' in test suite '${ data.suiteId }' is not registered`
        );

        switch (data.type) {
            case SchemaType.LOG:
                this.eventEmitter.emit('log', data, source);
                break;

            case SchemaType.ERROR:
                this.completeSuite(data.suiteId, true);
                this.eventEmitter.emit('error', data, source);
                break;

            case SchemaType.STATUS:
                this.eventEmitter.emit('status', data, source);
                break;

            case SchemaType.ACTION:
                this.eventEmitter.emit('action', data, source);
                break;

            default:
                const errorMessage = `Invalid schema type '${ data.type }' detected for runner '${ data.runnerId }' in test suite '${ data.suiteId }'`;
                throw new xJetError(errorMessage);
        }
    }

    /**
     * Generates a random identifier string for internal use
     *
     * @returns Random alphanumeric string that serves as a unique identifier
     *
     * @remarks
     * This method creates a 14-character random string by concatenating two substrings
     * of base-36 numbers (digits and lowercase letters). The resulting string is
     * sufficient for most internal identification purposes but is not cryptographically secure.
     *
     * @example
     * ```ts
     * const id = this.generateId();
     * // Example output: "a7bcd3efg12hij"
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    protected generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
    }
}
