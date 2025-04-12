/**
 * Import will remove at compile time
 */

import type { BaseTarget } from '@targets/base.target';
import type { AbstractReporter } from '@reports/abstract.reporter';
import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join } from 'path';
import { watch } from 'fs/promises';
import { xJetError } from '@errors/xjet.error';
import { LocalTarget } from '@targets/local.target';
import { SpecsProvider } from '@providers/specs.provider';
import { ExternalTarget } from '@targets/external.target';
import { MessageHandler } from '@handler/message.handler';
import { transpileFiles } from '@services/transpiler.service';
import { Colors, setColor } from '@components/colors.component';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Constants for file filtering
 */

const SUPPORTED_FILE_EXTENSIONS = [ '.ts', '.js' ];

/**
 * Defines a newline banner for JavaScript files that provides protection for sourcemaps.
 * The newline creates a buffer line where __XJET data can be appended in the external target.
 *
 * @since 1.0.0
 */

const banner = {
    js: '\n'
};

/**
 * Defines a footer content to be appended to transpiled JavaScript files.
 * Currently configured with an empty string value.
 *
 * @since 1.0.0
 */

const footer = {
    js: 'state.getInstance().run({}).catch(xJet.log)'
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
     *
     * @see SpecsProvider
     * @since 1.0.0
     */

    private readonly specs: SpecsProvider;

    /**
     * The target used to execute test suites.
     *
     * @see BaseTarget
     * @since 1.0.0
     */

    private readonly target: BaseTarget;

    /**
     * Handles message processing logic for a specific context or application.
     *
     * @see MessageHandler
     * @since 1.0.0
     */

    private readonly messageHandler: MessageHandler;

    /**
     * Creates an instance of the SuitesService.
     *
     * @param config - The configuration settings for test execution
     * @param reporter - The reporter to use
     *
     * @since 1.0.0
     */

    constructor(private config: ConfigurationInterface, private reporter: AbstractReporter) {
        this.target = this.createTarget();
        this.specs = new SpecsProvider(config);
        this.messageHandler = new MessageHandler(this.target, this.reporter);

        this.target.on('log', this.messageHandler.handleLog.bind(this.messageHandler));
        this.target.on('error', this.messageHandler.handleSuiteError.bind(this.messageHandler));
        this.target.on('status', this.messageHandler.handleSuiteStatus.bind(this.messageHandler));
        this.target.on('action', this.messageHandler.handleSuiteAction.bind(this.messageHandler));
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

    async executeSuite(): Promise<void> {
        const transpiled = await this.transpileSuites();
        await this.target.initTarget();
        this.messageHandler.handlePendingSuite(
            Object.keys(transpiled), (<ExternalTarget> this.target)?.runners?.size ?? -1
        );

        if (this.config.watch) {
            return this.watchForChanges(transpiled);
        }

        await this.target.executeSuites(transpiled);
        this.reporter?.finish?.();
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
            const watcher = watch(FrameworkProvider.getInstance().paths.root, { recursive: true });
            await this.target.executeSuites(transpiled, true);

            for await (const { filename } of watcher) {
                if (!this.shouldProcessFile(filename))
                    continue;

                transpiled = await this.transpileSuites();
                await this.target.executeSuites(transpiled, true);
                this.reporter?.finish?.();
            }
        } catch (error) {
            throw new xJetError((<Error>error).message);
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

        return this.target.numberActiveTask <= 0;
    }

    /**
     * Creates the appropriate test execution target based on configuration.
     *
     * @returns An instance of either LocalTarget or ExternalTarget
     *
     * @remarks
     * Returns an ExternalTarget if testRunners are configured, otherwise returns a LocalTarget.
     *
     * @see LocalTarget
     * @see ExternalTarget
     *
     * @since 1.0.0
     */

    private createTarget(): LocalTarget | ExternalTarget {
        return (this.config.testRunners && this.config.testRunners.length > 0)
            ? new ExternalTarget(this.config)
            : new LocalTarget(this.config);
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
        const files = this.specs.getSpecFiles(FrameworkProvider.getInstance().paths.root);
        if(Object.keys(files).length === 0) {
            throw setColor(Colors.Red, `No test files found for ${
                setColor(Colors.Gray, this.config.files.join(', '))
            }`);
        }

        return await transpileFiles(files, {
            ...this.config.build,
            banner,
            footer,
            minify: false,
            inject: [ join(FrameworkProvider.getInstance().paths.dist, 'index.js') ],
            logLevel: 'silent',
            sourcemap: 'both', // Todo find a way todo this only in debug mode
            minifySyntax: true,
            preserveSymlinks: true,
            minifyWhitespace: true,
            minifyIdentifiers: false
        });
    }
}
