import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import { relative } from 'path';
import { frameworkProvider } from '@providers/framework.provider';
import { SourceService } from '@remotex-labs/xmap';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import type { ConfigurationInterface, TestRunnerInterface } from '@configuration/interfaces/configuration.interface';
import { xJetError } from '@errors/xjet.error';
import { BaseAdapter } from '@adapters/base.adapter';

export class ExternalAdapter extends BaseAdapter {
    /**
     * Creates a new ExternalAdapter instance
     *
     * @param config - Configuration with test runners
     *
     * @throws xJetError if no test runners are configured
     *
     * @since 1.0.0
     */

    constructor(protected override config: ConfigurationInterface) {
        super(config);

        if (!this.config.testRunners) {
            throw new xJetError('Test runners configuration is required for ExternalAdapter');
        }
    }

    /**
     * Initializes all test runners with dispatch handler
     *
     * @since 1.0.0
     */
    async initAdapter(): Promise<void> {
        try {
            for (const runner of this.config.testRunners!) {
                runner.id = this.generateId();
                this.messageHandler.setRunner(runner.id, runner.name);
                await runner.connection(this.dispatch.bind(this));
            }
        } catch (error: unknown) {
            throw new VMRuntimeError(error as VMRuntimeError, frameworkProvider.configuration!);
        }
    }

    async executeSuites(testFiles: TranspileFileTypes): Promise<void> {
        const executionPromises: Promise<void>[] = [];

        for (const runner of this.config.testRunners!) {
            this.messageHandler.setRunner(runner.id!, runner.name);

            for (const [ filePath, { sourceMap, code }] of Object.entries(testFiles)) {
                const relativePath = relative(frameworkProvider.paths.root, filePath);
                const sourceService = new SourceService(sourceMap, filePath);

                executionPromises.push(this.queue.enqueue(async() => {
                    return this.executeTestWithRunner(code, relativePath, sourceService, runner);
                }, runner.id!));
            }
        }

        this.queue.start();
        await Promise.all(executionPromises);
        for (const runner of this.config.testRunners!) {
            await runner.disconnect();
        }
        console.log('end');
    }

    private executeTestWithRunner(
        testCode: string,
        testFilePath: string,
        sourceService: SourceService,
        runner: TestRunnerInterface
    ): Promise<void> {
        const suiteId = this.generateId();
        this.messageHandler.setSuiteSource(suiteId, sourceService);

        return new Promise<void>(async (resolve, reject) => {
            try {
                this.runningSuites.set(suiteId, resolve);
                const testContext = {
                    seed: this.config.seed,
                    bail: this.config.bail,
                    filter: this.config.filter,
                    timeout: this.config.timeout,
                    suiteId: suiteId,
                    runnerId: runner.id,
                    relativePath: testFilePath
                };

                const preparedTestCode = this.prepareTestCodeWithContext(testCode, testContext);
                await runner.dispatch(Buffer.from(preparedTestCode));
            } catch (error) {
                this.completeTask(suiteId);
                this.queue.removeTasksByRunner(runner.id!);

                const runtimeError = new VMRuntimeError(error as VMRuntimeError, frameworkProvider.configuration!);
                console.log(runtimeError);

                if (this.config.bail) {
                    reject();
                } else {
                    resolve();
                }
            } finally {
                console.log('send');
            }
        });
    }

    private prepareTestCodeWithContext(testCode: string, context: Record<string, unknown>): string {
        return `const __XJET__ = ${JSON.stringify(context)}; ${testCode}`;
    }
}
