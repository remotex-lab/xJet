/**
 * Import will remove at compile time
 */

import type {
    LogMessageInterface,
    ErrorMessageInterface,
    ActionMessageInterface,
    StatusMessageInterface
} from '@handler/interfaces/message-handler.interface';

/**
 * Abstract base reporter class that defines the interface for all reporter implementations
 * used for logging, status tracking, and error handling during test execution.
 *
 * @throws ReporterInitializationError - When initialization fails due to invalid configuration
 *
 * @remarks
 * Implement this abstract class to create custom reporters for different output formats or destinations.
 * Each implementation must provide concrete implementations for all abstract methods.
 *
 * @example
 * ```ts
 * class ConsoleReporter extends AbstractReporter {
 *   init(suites: Array<string>): void {
 *     console.log(`Running test suites: ${suites.join(', ')}`);
 *   }
 *
 *   log(log: LogMessageInterface): void {
 *     console.log(`[LOG] ${log.message}`);
 *   }
 *
 *   // ... other method implementations
 * }
 * ```
 *
 * @see LogMessageInterface
 * @see ErrorMessageInterface
 * @see StatusSchemaInterface
 * @see ActionMessageInterface
 *
 * @since 1.0.0
 */

export abstract class AbstractReporter {
    /**
     * Creates a new AbstractReporter instance with specified logging behavior
     *
     * @param silentLog - Controls whether logging should be suppressed
     *
     * @since 1.0.0
     */

    protected constructor(protected silentLog: boolean) {};

    /**
     * Initializes the reporter with a list of test suites to be executed.
     *
     * @param suites - Array of suite names that will be processed
     * @param runnerCount - The number of assigned runners. A value of -1 indicates a local runner.
     *
     * @throws InitializationError - When the reporter fails to initialize
     *
     * @since 1.0.0
     */

    abstract init(suites: Array<string>, runnerCount: number): void;

    /**
     * Records a log message during test execution.
     *
     * @param log - Log message object containing message details
     *
     * @see LogMessageInterface
     * @since 1.0.0
     */

    abstract log(log: LogMessageInterface): void;

    /**
     * Updates the status of a test or test suite including (skip, todo).
     *
     * @param status - Status schema object containing current execution status
     *
     * @see StatusSchemaInterface
     * @since 1.0.0
     */

    abstract status(status: StatusMessageInterface): void;

    /**
     * Records an action performed during test execution.
     *
     * @param action - Action message object containing action details
     *
     * @remarks
     * Note: Method name should be changed to lowercase 'action' to follow naming conventions
     *
     * @see ActionMessageInterface
     * @since 1.0.0
     */

    abstract action(action: ActionMessageInterface): void;

    /**
     * Reports an error that occurred during suite execution.
     *
     * @param error - Error message object containing error details
     *
     * @see ErrorMessageInterface
     * @since 1.0.0
     */

    abstract suiteError(error: ErrorMessageInterface): void;

    /**
     * Reports that finish all suites.
     *
     * @since 1.0.0
     */

    abstract finish(): void;
}
