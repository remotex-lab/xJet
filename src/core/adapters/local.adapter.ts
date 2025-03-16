/**
 * Import will remove at compile time
 */

import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { relative } from 'path';
import { SourceService } from '@remotex-labs/xmap';
import { BaseAdapter } from '@adapters/base.adapter';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { frameworkProvider } from '@providers/framework.provider';

/**
 * Adapter implementation for executing tests in a local Node.js environment
 * through isolated sandbox contexts.
 *
 * @since 1.0.0
 */

export class LocalAdapter extends BaseAdapter {
    /**
     * Unique identifier for the runner instance.
     * @since 1.0.0
     */

    private runnerId: string = this.generateId();

    /**
     * Initializes the local adapter with necessary configurations.
     *
     * @returns A promise that resolves when initialization is complete
     *
     * @since 1.0.0
     */

    async initAdapter(): Promise<void> {
        this.messageHandler.setRunner(this.runnerId, 'Local');
    }

    /**
     * Executes the provided test suites in the local environment.
     *
     * @param transpileFiles - Map of file paths to their transpiled code and sourcemaps
     * @returns A promise that resolves when all test suites have completed execution
     *
     * @remarks This method queues all test files for execution and processes them based on the
     * configured parallelism level
     *
     * @example
     * ```ts
     * const adapter = new LocalAdapter(config);
     * await adapter.initAdapter();
     * await adapter.executeSuites(transpileFiles);
     * ```
     *
     * @since 1.0.0
     */

    async executeSuites(transpileFiles: TranspileFileTypes): Promise<void> {
        const testExecutionTasks = [];

        // Prepare all test execution tasks
        for (const [ filePath, { sourceMap, code }] of Object.entries(transpileFiles)) {
            const relativePath = relative(frameworkProvider.paths.root, filePath);
            const sourceService = new SourceService(sourceMap, filePath);

            testExecutionTasks.push(this.queue.enqueue(async () => {
                return this.executeTestWithErrorHandling(code, relativePath, sourceService);
            }));
        }

        this.queue.start();
        await Promise.all(testExecutionTasks);
    }

    /**
     * Executes a test file with proper error handling and source mapping.
     *
     * @param testCode - The transpiled JavaScript code to execute
     * @param testFilePath - Relative path to the test file
     * @param sourceService - Service for handling source mappings
     * @returns A promise that resolves when the test execution completes
     *
     * @throws VMRuntimeError - If test execution fails and bail is set to true
     *
     * @remarks Test failures are captured and processed according to the bail configuration
     *
     * @since 1.0.0
     */

    private executeTestWithErrorHandling(testCode: string, testFilePath: string, sourceService: SourceService): Promise<void> {
        const suiteId = this.generateId();
        this.messageHandler.setSuiteSource(suiteId, sourceService);

        return new Promise((resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, resolve);
                this.executeInSandbox(testCode, testFilePath, suiteId);
            } catch (error) {
                this.completeTask(suiteId);

                // todo runtime error
                const runtimeError = new VMRuntimeError(error as VMRuntimeError, sourceService);
                console.log(runtimeError);
                if (this.config.bail)
                    reject();
                else
                    resolve();
            }
        });
    }

    /**
     * Executes test code in an isolated sandbox environment.
     *
     * @param testCode - The JavaScript code to execute
     * @param testFilePath - Path to the test file for error reporting
     * @param suiteId - Unique identifier for this test suite execution
     *
     * @remarks The sandbox provides a controlled environment with limited globals and
     * includes test configuration and communication channels
     *
     * @since 1.0.0
     */

    private executeInSandbox(testCode: string, testFilePath: string, suiteId: string): void {
        const sandboxContext = {
            Buffer,
            setTimeout,
            setInterval,
            __XJET__: {
                seed: this.config.seed,
                bail: this.config.bail,
                filter: this.config.filter,
                timeout: this.config.timeout,
                suiteId: suiteId,
                runnerId: this.runnerId,
                relativePath: testFilePath
            },
            dispatch: this.dispatch.bind(this)
        };

        const sandboxOptions = { filename: testFilePath };
        sandboxExecute(testCode, sandboxContext, sandboxOptions);
    }
}
