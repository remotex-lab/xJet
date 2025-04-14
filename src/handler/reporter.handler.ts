/**
 * Import will remove at compile time
 */

import type { AbstractReporter } from '@reports/abstract.reporter';
import type { ConstructorType } from '@interfaces/function.interface';
import type { TranspileFileInterface } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { createRequire } from 'module';
import { xJetError } from '@errors/xjet.error';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import ConsoleReporter from '@reports/console.reporter';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import { patchEventEmitterErrors } from '@configuration/parse.configuration';

/**
 * Object containing global constructs available in the sandbox execution context
 *
 * @remarks
 * This object provides essential JavaScript globals to the sandbox environment
 * while maintaining isolation from the host environment.
 *
 * @default As shown in the initialization
 *
 * @example
 * ```ts
 * // Using the sandbox context in VM execution
 * const result = vm.runInNewContext(code, SANDBOX_CONTEXT);
 * ```
 *
 * @see vm.runInNewContext
 * @since 1.0.0
 */

const SANDBOX_CONTEXT = {
    Error,
    Buffer,
    RegExp,
    console,
    setTimeout,
    setInterval
};

/**
 * Module require function instance scoped to the current module's URL
 *
 * @see createRequire
 * @since 1.0.0
 */

const require = createRequire(import.meta.url);

/**
 * Retrieves the appropriate reporter instance based on configuration
 *
 * @returns A reporter instance that extends AbstractReporter
 *
 * @throws xJetError - When the external reporter file exists but doesn't have a valid default export
 * @throws VMRuntimeError - When the reporter constructor throws an error
 *
 * @remarks
 * This method determines which reporter to use based on the configuration.
 * If the reporter is set to 'default' or the specified file doesn't exist,
 * it will return a ConsoleReporter. Otherwise, it attempts to load and
 * instantiate the custom reporter from the specified path.
 *
 * @example
 * ```ts
 * const reporter = await reporterHandler.getReporter();
 * await reporter.generate(results);
 * ```
 *
 * @see ConsoleReporter
 * @see AbstractReporter
 *
 * @since 1.0.0
 */

export async function getReporter(config: ConfigurationInterface): Promise<AbstractReporter> {
    const { reporter } = config;

    // Use default reporter if the path is 'default' or the file doesn't exist
    if (reporter === 'default' || !existsSync(reporter)) {
        return new ConsoleReporter(config.silent);
    }

    const Reporter = await parseExternalReport(reporter);
    if (!Reporter) {
        throw new xJetError(`Reporter at "${ config.reporter }" does not have a valid default export`);
    }

    try {
        return new Reporter(config.silent);
    } catch (error) {
        throw new VMRuntimeError(<Error> error);
    }
}

/**
 * Parses an external reporter module from the given file path
 *
 * @param reporterPath - Path to the reporter module file
 * @returns Constructor for the reporter, or undefined if no default export was found
 *
 * @throws VMRuntimeError - When there's an error during the external reporter file execution
 *
 * @remarks
 * This method transpiles the reporter file, creates a sandbox execution context,
 * and safely loads the reporter class from the external file. It uses a source map
 * for better error reporting and patches event emitter errors to provide more
 * context in case of failures.
 *
 * @example
 * ```ts
 * const ReporterClass = await this.parseExternalReport('./custom-reporter.js');
 * if (ReporterClass) {
 *   const reporter = new ReporterClass();
 * }
 * ```
 *
 * @internal
 * @see SourceService
 * @see sandboxExecute
 *
 * @since 1.0.0
 */

export async function parseExternalReport(reporterPath: string): Promise<ConstructorType | undefined> {
    const { code, sourceMap } = await transpile(reporterPath);
    const source = new SourceService(sourceMap, reporterPath);

    try {
        const module = { exports: { default: undefined } };
        patchEventEmitterErrors(source);

        const executionContext = {
            ...SANDBOX_CONTEXT,
            module,
            require
        };

        await sandboxExecute(code, executionContext, { filename: reporterPath });

        return module.exports.default;
    } catch (error) {
        throw new VMRuntimeError(<Error> error, source);
    }
}

/**
 * Transpiles the given reporter file using the transpileFile utility
 *
 * @param reporterPath - Path to the reporter file to be transpiled
 * @returns Promise resolving to a transpiled file object containing code and source map
 *
 * @remarks
 * This method configures transition with specific options:
 * - No minification to preserve readability
 * - Targets Node.js platform
 * - Suppresses logging output
 * - Treats packages as external dependencies
 *
 * @see transpileFile
 * @internal
 * @since 1.0.0
 */

export async function transpile(reporterPath: string): Promise<TranspileFileInterface> {
    return transpileFile(reporterPath, {
        minify: false,
        platform: 'node',
        logLevel: 'silent',
        packages: 'external'
    });
}
