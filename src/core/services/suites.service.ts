/**
 * Import will remove at compile time
 */

import type { BaseAdapter } from '@adapters/base.adapter';
import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join } from 'path';
import { watch } from 'fs/promises';
import { xJetError } from '@errors/xjet.error';
import { LocalAdapter } from '@adapters/local.adapter';
import { SpecsProvider } from '@providers/specs.provider';
import { ExternalAdapter } from '@adapters/external.adapter';
import { transpileFiles } from '@services/transpiler.service';
import { frameworkProvider } from '@providers/framework.provider';

/**
 * Constants for file filtering
 */

const SUPPORTED_FILE_EXTENSIONS = [ '.ts', '.js' ];

/**
 * Banner code that gets prepended to all transpiled test files.
 * Initiates a try block to catch any runtime errors during test execution.
 *
 * @remarks
 * This is used with esbuild's banner option during the transpilation process
 * to automatically wrap all test code in error handling.
 *
 * @since 1.0.0
 */

const banner = {
    js: 'try {'
};

/**
 * Footer code that gets appended to all transpiled test files.
 * Provides comprehensive error handling for any uncaught exceptions.
 *
 * @remarks
 * Contains a catch block that:
 * 1. Serializes the error with all its properties
 * 2. Dispatches the error information through a binary protocol
 * 3. Preserves the original stack trace and error details
 *
 * The error is sent using a predefined binary format:
 * - First byte: Error type marker (2)
 * - Next bytes: Suite ID from __XJET__ context
 * - Next bytes: Runner ID from __XJET__ context
 * - Final bytes: JSON stringified error object
 *
 * @since 1.0.0
 */

const footer = {
    js: `} catch (error) {
        // Capture original stack trace and additional properties
        const serializedError = {
          message: error.message,
          stack: error.stack,
          name: error.name,
          ...error
        };

        // Dispatch the error through the buffer protocol
        dispatch(Buffer.concat([
          Buffer.from([2]),
          Buffer.from(__XJET__.suiteId),
          Buffer.from(__XJET__.runnerId),
          Buffer.from(JSON.stringify({ error: serializedError }))
        ]));
    }`
};


/**
 * Manages test suite execution, transpilation, and file watching functionality.
 * Provides a unified interface for running test suites either locally or with external runners.
 *
 * @since 1.0.0
 */

export class SuitesService {
    /**
     * Provider for test specification files.
     * @since 1.0.0
     */

    private readonly specs: SpecsProvider;

    /**
     * The adapter used to execute test suites.
     * @since 1.0.0
     */

    private readonly adapter: BaseAdapter;

    /**
     * Creates an instance of the SuitesService.
     *
     * @param config - The configuration settings for test execution
     *
     * @since 1.0.0
     */

    constructor(private config: ConfigurationInterface) {
        this.specs = new SpecsProvider(config);
        this.adapter = this.createAdapter();
    }

    /**
     * Executes a test suite with an optional file watching for continuous testing.
     *
     * @returns A promise that resolves when tests have been executed
     *
     * @example
     * ```ts
     * const suitesService = new SuitesService(config);
     * await suitesService.executeSuite();
     * ```
     *
     * @since 1.0.0
     */

    async executeSuite() {
        const transpiled = await this.transpileSuites();
        await this.adapter.initAdapter();

        if(this.config.watch) {
            return this.watchForChanges(transpiled);
        }

        await this.adapter.executeSuites(transpiled);
    }

    /**
     * Watches for file changes and re-runs tests when relevant source files are modified.
     *
     * @param initialTranspiled - Initially transpiled test files
     * @returns A promise that resolves when file watching ends
     *
     * @throws xJetError - If the file system watcher encounters issues
     *
     * @remarks
     * This method uses fs/promises.watch to monitor file changes recursively in the framework root directory.
     * It only triggers re-runs when TypeScript or JavaScript files change, and only when no tests are currently running.*
     *
     * @since 1.0.0
     */

    private async watchForChanges(initialTranspiled: TranspileFileTypes): Promise<void> {
        try {
            let transpiled = initialTranspiled;
            const watcher = watch(frameworkProvider.paths.root, { recursive: true });
            await this.adapter.executeSuites(transpiled);

            for await (const { filename } of watcher) {
                if (!this.shouldProcessFile(filename))
                    continue;

                transpiled = await this.transpileSuites();
                await this.adapter.executeSuites(transpiled);
            }
        } catch (error) {
            throw new xJetError((<Error> error).message);
        }
    }

    /**
     * Determines if a changed file should trigger test re-runs based on extension and execution status.
     *
     * @param filename - Name of the file that changed
     * @returns True if the file should trigger a test re-run
     *
     * @since 1.0.0
     */

    private shouldProcessFile(filename: string | null): boolean {
        if (!filename) return false;
        if (!SUPPORTED_FILE_EXTENSIONS.some(ext => filename.endsWith(ext))) return false;

        return this.adapter.numberActiveTask <= 0;
    }

    /**
     * Creates the appropriate test execution adapter based on configuration.
     *
     * @returns An instance of either LocalAdapter or ExternalAdapter
     *
     * @remarks
     * Returns an ExternalAdapter if testRunners are configured, otherwise returns a LocalAdapter.
     *
     * @see LocalAdapter
     * @see ExternalAdapter
     *
     * @since 1.0.0
     */

    private createAdapter(): LocalAdapter | ExternalAdapter {
        return (this.config.testRunners && this.config.testRunners.length > 0)
            ? new ExternalAdapter(this.config)
            : new LocalAdapter(this.config);
    }

    /**
     * Transpiles test suite files for execution.
     *
     * @returns A promise resolving to the transpiled file information
     *
     * @remarks
     * Uses the transpileFiles service to process test files, with configuration
     * from the main config plus some additional settings like injection points.
     *
     * @see transpileFiles
     *
     * @since 1.0.0
     */

    private async transpileSuites(): Promise<TranspileFileTypes> {
        const files = this.specs.getSpecFiles(frameworkProvider.paths.root);

        return await transpileFiles(files, {
            ...this.config.build,
            logLevel: 'silent',
            inject: [ join(frameworkProvider.paths.dist, 'index.js') ],
            banner,
            footer
        });
    }
}
