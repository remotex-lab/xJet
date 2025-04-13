/**
 * Import will remove at compile time
 */

import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface, TestRunnerInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { relative } from 'path';
import { BaseTarget } from './base.target';
import { xJetError } from '@errors/xjet.error';
import { SourceService } from '@remotex-labs/xmap';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Implementation of a test execution target that uses external test runners
 *
 * @remarks
 * The ExternalTarget class provides functionality for executing tests through external
 * test runner processes. It manages connections with multiple test runners, distributes
 * test files to them, and coordinates their execution. This class is responsible for
 * initializing test runners from configuration, establishing connections, and handling
 * the test execution lifecycle.
 *
 * @example
 * ```ts
 * const config = {
 *   testRunners: [
 *     { name: 'jest', connection: async (dispatch, id) => { ... } }
 *   ],
 *   // other configuration options
 * };
 *
 * const externalTarget = new ExternalTarget(config);
 * await externalTarget.initTarget();
 * await externalTarget.executeSuites(transpileFiles);
 * ```
 *
 * @see TranspileFileTypes
 * @see TestRunnerInterface
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */

export class ExternalTarget extends BaseTarget {
    /**
     * Stores registered test runner instances with their unique identifiers
     *
     * @readonly
     * @default new Map()
     * @since 1.0.0
     */

    readonly runners: Map<string, TestRunnerInterface> = new Map();

    /**
     * Creates a new instance of the ExternalTarget class
     *
     * @param config - Configuration object containing test runner settings
     *
     * @throws xJetError - If the configuration doesn't have test runners defined
     *
     * @since 1.0.0
     */

    constructor(protected config: ConfigurationInterface) {
        super(config);
        if (!this.config.testRunners) {
            throw new xJetError('Test runners configuration is required for ExternalTarget');
        }
    }

    /**
     * Initializes all the test runners from configuration and establishes connections
     *
     * @override
     * @returns Promise that resolves when all runners are initialized
     *
     * @throws VMRuntimeError - When there's an error initializing a test runner connection
     *
     * @remarks
     * Each runner is assigned a unique ID and stored in the runners map. If a runner fails to
     * initialize, the error is logged but doesn't prevent other runners from initializing.
     *
     * @see TestRunnerInterface
     *
     * @since 1.0.0
     */

    async initTarget(): Promise<void> {
        for (const runner of this.config.testRunners!) {
            try {
                runner.id = this.generateId();
                await runner.connection(this.dispatch.bind(this), runner.id);
                this.runners.set(runner.id, runner);
            } catch (error) {
                console.error(new VMRuntimeError(<Error>error, FrameworkProvider.getInstance().configuration));
            }
        }
    }

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

    getRunnerName(runnerId: string): string {
        const name = this.runners.get(runnerId)?.name;
        if (!name) {
            throw new xJetError(`Runner with ID ${ runnerId } not found`);
        }

        return name;
    }

    /**
     * Executes the compiled test suites across all registered test runners
     *
     * @override
     * @param transpileFiles - Map of transpiled test files with their source maps and code
     * @param watchMode - Indicates whether continuous monitoring mode is enabled
     * @returns Promise that resolves when all test suites complete execution
     *
     * @remarks
     * The method queues test files for each runner, starts the execution queue, waits for all tests
     * to complete, and finally disconnects all runners. Tests are executed in parallel but managed
     * by the queue system to control concurrency.
     *
     * @see TestRunnerInterface
     * @see SourceService
     *
     * @since 1.0.0
     */

    async executeSuites(transpileFiles: TranspileFileTypes, watchMode: boolean = false): Promise<void> {
        const testExecutionTasks: Promise<void>[] = [];
        const root = FrameworkProvider.getInstance().paths.root;

        for (const [ filePath, { sourceMap, code }] of Object.entries(transpileFiles)) {
            const relativePath = relative(root, filePath);
            const sourceService = new SourceService(sourceMap, filePath);

            this.runners.forEach((runner: TestRunnerInterface, id: string) => {
                testExecutionTasks.push(this.queue.enqueue(async () => {
                    return this.executeTestWithErrorHandling(code, relativePath, sourceService, runner);
                }, id));
            });
        }

        this.queue.start();
        await Promise.allSettled(testExecutionTasks);
        if(!watchMode) this.disconnectAllRunners();
    }

    /**
     * Disconnects all registered test runners and logs any errors that occur
     *
     * @throws VMRuntimeError - If a runner fails to disconnect properly (error is caught and logged)
     *
     * @remarks
     * This method iterates through all test runners and calls their disconnect method.
     * If any runner fails to disconnect, the error is caught, wrapped in a VMRuntimeError,
     * and logged to console, but does not stop other runners from disconnecting.
     *
     * @see TestRunnerInterface
     *
     * @since 1.0.0
     */

    private disconnectAllRunners(): void {
        this.runners.forEach((runner: TestRunnerInterface, id: string) => {
            runner.disconnect().catch(error => {
                console.error(
                    `Error disconnecting runner ${ id }:`,
                    new VMRuntimeError(error, FrameworkProvider.getInstance().configuration)
                );
            });
        });
    }

    /**
     * Executes a test file in the specified runner with error handling and tracking
     *
     * @param testCode - The transpiled JavaScript code to execute
     * @param testFilePath - The relative path to the test file
     * @param sourceService - Service providing source mapping information
     * @param runner - The test runner interface that will execute the test
     * @returns Promise that resolves when the test execution is complete
     *
     * @throws VMRuntimeError - When there's an error during test execution
     *
     * @remarks
     * This method assigns a unique ID to the test suite, registers the source service,
     * and tracks the running suite with Promise resolvers. The actual execution is
     * delegated to the executeInRunner method.
     *
     * @see SourceService
     * @see TestRunnerInterface
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, testFilePath: string, sourceService: SourceService, runner: TestRunnerInterface): Promise<void> {
        const suiteId = this.generateId();
        this.suites.set(suiteId, sourceService);

        return new Promise<void>(async (resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, { resolve, reject });
                await this.executeInRunner(testCode, testFilePath, suiteId, runner);
            } catch (error) {
                this.eventEmitter.emit('error', error, FrameworkProvider.getInstance().configuration);
                this.completeSuite(suiteId, true);
            }
        });
    }

    /**
     * Executes a test file within a specific test runner with the appropriate runtime context
     *
     * @param testCode - The transpiled JavaScript code to execute
     * @param testFilePath - The relative path to the test file
     * @param suiteId - The unique identifier for the test suite
     * @param runner - The test runner interface that will execute the test
     * @returns Promise that resolves when the test has been dispatched to the runner
     *
     * @throws Error - When there's an error dispatching the test to the runner
     *
     * @remarks
     * This method constructs a runtime context with configuration values, prepares the test code
     * by injecting this context, and dispatches the code to the runner for execution.
     * The runtime context includes configuration options like randomize, bail, filter, timeout,
     * and identifiers for tracking the test execution.
     *
     * @see TestRunnerInterface
     *
     * @since 1.0.0
     */

    private async executeInRunner(testCode: string, testFilePath: string, suiteId: string, runner: TestRunnerInterface): Promise<void> {
        const runtimeContext = {
            bail: this.config.bail,
            filter: this.config.filter,
            timeout: this.config.timeout,
            suiteId: suiteId,
            runnerId: runner.id,
            randomize: this.config.randomize,
            relativePath: testFilePath
        };

        const preparedTestCode = this.prepareTestCodeWithContext(testCode, runtimeContext);
        await runner.dispatch(Buffer.from(preparedTestCode), suiteId);
    }

    /**
     * Prepares test code by injecting a runtime context object
     *
     * @param testCode - The original test code to be executed
     * @param context - Runtime context object containing configuration and identifying information
     *
     * @returns String containing the test code with injected runtime context
     *
     * @remarks
     * This method injects a special __XJET global object containing runtime configuration
     * at the beginning of the test code. The test framework can then access this object
     * to retrieve configuration values and contextual information.
     *
     * @since 1.0.0
     */

    private prepareTestCodeWithContext(testCode: string, context: Record<string, unknown>): string {
        return `const __XJET = { runtime: ${ JSON.stringify(context) } }; ${ testCode }`;
    }
}
