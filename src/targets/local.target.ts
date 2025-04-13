/**
 * Import will remove at compile time
 */

import type { ModuleInterface } from '@configuration/interfaces/configuration.interface';
import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { relative } from 'path';
import { createRequire } from 'module';
import { BaseTarget } from './base.target';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { errorToSerializable } from '@components/json.component';
import { FrameworkProvider } from '@providers/framework.provider';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Implementation of a test execution target that runs tests in the local environment
 *
 * @remarks
 * The LocalTarget class provides functionality for executing tests within the local JavaScript
 * environment. Unlike ExternalTarget, it doesn't rely on external test runner processes
 * but instead uses a sandbox execution mechanism to run tests in isolation. This class
 * handles the test execution lifecycle including file processing, error handling, and
 * source mapping for accurate error reporting.
 *
 * @example
 * ```ts
 * const config = {
 *   // configuration options
 * };
 *
 * const localTarget = new LocalTarget(config);
 * await localTarget.initTarget();
 * await localTarget.executeSuites(transpileFiles);
 * ```
 *
 * @see SourceService
 * @see FrameworkProvider
 * @see TranspileFileTypes
 *
 * @since 1.0.0
 */

export class LocalTarget extends BaseTarget {
    /**
     * Unique identifier for the runner instance
     *
     * @default Generated using this.generateId()
     * @since 1.0.0
     */

    private runnerId: string = this.generateId();

    /**
     * Initializes the local adapter with necessary configurations
     *
     * @returns A promise that resolves when initialization is complete
     *
     * @since 1.0.0
     */

    async initTarget(): Promise<void> {
    }

    /**
     * Retrieves the name of a runner based on its identifier
     *
     * @returns The human-readable name of the specified runner
     *
     * @see runningSuitesInterface
     * @since 1.0.0
     */

    getRunnerName(): string {
        return 'local';
    }

    /**
     * Executes the provided test suites in the local environment
     *
     * @param transpileFiles - Map of file paths to their transpiled code and sourcemaps
     * @returns A promise that resolves when all test suites have completed execution
     *
     * @remarks This method queues all test files for execution and processes them based on the
     * configured parallelism level
     *
     * @example
     * ```ts
     * const adapter = new LocalTarget(config);
     * await adapter.initTarget();
     * await adapter.executeSuites(transpileFiles);
     * ```
     *
     * @since 1.0.0
     */

    async executeSuites(transpileFiles: TranspileFileTypes): Promise<void> {
        const testExecutionTasks = [];

        // Prepare all test execution tasks
        for (const [ filePath, { sourceMap, code }] of Object.entries(transpileFiles)) {
            const relativePath = relative(FrameworkProvider.getInstance().paths.root, filePath);
            const sourceService = new SourceService(sourceMap, filePath);

            testExecutionTasks.push(this.queue.enqueue(async () => {
                return this.executeTestWithErrorHandling(code, relativePath, sourceService);
            }));
        }

        this.queue.start();
        await Promise.allSettled(testExecutionTasks);
    }

    /**
     * Executes a test file with proper error handling and source mapping
     *
     * @param testCode - The transpiled JavaScript code to execute
     * @param testFilePath - Relative path to the test file
     * @param sourceService - Service for handling source mappings
     * @returns A promise that resolves when the test execution completes
     *
     * @remarks Errors during test execution are caught and emitted as 'error' events
     * rather than being thrown. This ensures that test failures don't stop the entire
     * test run process.
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, testFilePath: string, sourceService: SourceService): Promise<void> {
        const suiteId = this.generateId();
        this.suites.set(suiteId, sourceService);

        return new Promise(async (resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, { resolve, reject });
                await this.executeInSandbox(testCode, testFilePath, suiteId);
            } catch (error) {
                this.completeSuite(suiteId, true);
                this.eventEmitter.emit('error', {
                    type: SchemaType.ERROR,
                    error: JSON.stringify(errorToSerializable(<Error> error)),
                    suiteId: suiteId,
                    runnerId: this.runnerId
                }, sourceService);
            }
        });
    }

    /**
     * Executes a test file in an isolated sandbox environment
     *
     * @param testCode - The transpiled JavaScript code to execute
     * @param testFilePath - Relative path to the test file
     * @param suiteId - Unique identifier for the test suite
     * @returns A promise that resolves when the sandbox execution completes
     *
     * @remarks The sandbox provides a controlled environment with specific globals
     * and runtime configuration for test execution. This prevents tests from
     * interfering with each other and the main process.
     *
     * @example
     * ```ts
     * await executeInSandbox(
     *   compiledTestCode,
     *   'tests/unit/example.test.js',
     *   'suite-123'
     * );
     * ```
     *
     * @internal
     * @since 1.0.0
     */

    private async executeInSandbox(testCode: string, testFilePath: string, suiteId: string): Promise<void> {
        const module: ModuleInterface = { exports: {} };
        const require = createRequire(import.meta.url);

        const sandboxContext = {
            Buffer,
            module,
            require,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            __XJET: {
                runtime: {
                    bail: this.config.bail,
                    filter: this.config.filter,
                    timeout: this.config.timeout,
                    suiteId: suiteId,
                    runnerId: this.runnerId,
                    randomize: this.config.randomize,
                    relativePath: testFilePath
                }
            },
            dispatch: this.dispatch.bind(this)
        };

        const sandboxOptions = { filename: testFilePath };
        await sandboxExecute(testCode, sandboxContext, sandboxOptions);
    }
}
