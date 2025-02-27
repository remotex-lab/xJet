/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface, ModuleInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { createRequire } from 'module';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { transpileFile } from '@services/transpiler.service';


/**
 * Parses and processes a configuration file, transpiling and executing its content
 * in a sandboxed environment to extract the exported configuration object.
 *
 * @param file - The file path to the configuration file that will be parsed and executed.
 * @returns A Promise that resolves to a configuration object implementing the `ConfigurationInterface`.
 *
 * @throws VMRuntimeError - Throws an error if the execution of the transpiled code fails in the sandbox.
 *
 * @remarks
 * This method is designed to securely execute the configuration file in an isolated
 * environment and retrieve its exported default module.
 * The file is transpiled prior to execution to ensure compatibility with different module environments.
 *
 * @since 1.0.0
 */

export async function parseConfigurationFile(file: string): Promise<ConfigurationInterface> {
    const { code, sourceMap } = await transpileFile(file, {
        banner: { js: '(function(module, exports) {' },
        footer: { js: '})(module, module.exports);' }
    });

    const sourceMapObject = JSON.parse(sourceMap);
    if(sourceMapObject.mappings.length < 1)
        return <ConfigurationInterface> {};

    const module: ModuleInterface = { exports: {} };
    const require = createRequire(import.meta.url);
    const source = new SourceService(sourceMapObject);

    try {
        await sandboxExecute(code, {
            require,
            module
        });
    } catch (error: unknown) {
        console.error(error);
    }

    return <ConfigurationInterface> module.exports.default;
}
