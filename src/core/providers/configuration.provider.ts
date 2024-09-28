/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@services/interfaces/cli.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { defaultConfiguration } from '@configuration/default.configuration';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Parses CLI arguments and sets the configuration for the application.
 *
 * This function takes an instance of `Argv` (from `yargs` or a similar library) and extracts the configuration values from it.
 * It then merges these values with default settings to produce a final configuration object of type `ConfigurationInterface`.
 *
 * @param cli - An instance of `Argv<ArgvInterface>` that contains CLI arguments and options. This should match the
 * `ArgvInterface` which defines the shape of CLI arguments supported by the application.
 *
 * @returns The final configuration object as a `ConfigurationInterface`, combining default values with those
 * provided via CLI arguments. This object is used to configure the application,
 * particularly for tasks related to esbuild, development settings, and other build options.
 *
 * @throws Error - Throws an error if critical configuration properties are missing or invalid.
 *
 * @example
 * ``` typescript
 * // Example usage:
 * import { Argv } from 'yargs';
 * import { setCliConfiguration } from './path-to-your-function';
 *
 * const argv = yargs.argv as Argv<ArgvInterface>;
 * try {
 *     const config = setCliConfiguration(argv);
 *     console.log(config);
 * } catch (error) {
 *     console.error('Error setting CLI configuration:', error);
 * }
 * ```
 */

function setCliConfiguration(cli: Argv<ArgvInterface>): ConfigurationInterface {
    const args = <ArgvInterface> cli.argv;
    const config: ConfigurationInterface = {
        ...defaultConfiguration
    };

    if (args.file) {
        // Todo fix cli override user config
        config.include = [ args.file.replaceAll('\\', '/') ];
    }

    return config;
}

/**
 * Merges CLI arguments with a configuration file to produce a final configuration object.
 *
 * This function initializes the configuration using CLI arguments, and if a configuration file is specified
 * and exists, it extends or overrides the initial configuration with values from the file. The final configuration
 * is validated to ensure that critical fields are defined.
 *
 * @param configFile - The path to the configuration file to read and merge with CLI arguments. This file should
 *                     be in a format that can be parsed by `parseConfigurationFile`.
 * @param cli - An instance of `Argv<ArgvInterface>` containing CLI arguments and options.
 *
 * @returns A promise that resolves to the final `ConfigurationInterface` object, combining defaults, CLI arguments,
 *          and configuration file values.
 *
 * @throws Error - Throws an error if the `entryPoints` property in the final configuration is undefined.
 *
 * @see {@link ../configuration/parse.configuration.ts } for the function that parses the configuration file.
 *
 * @example
 * // Example usage:
 * import { Argv } from 'yargs';
 * import { configuration } from './path-to-your-function';
 *
 * const argv = yargs.argv as Argv<ArgvInterface>;
 *
 * configuration('path/to/config/file.json', argv)
 *     .then(config => {
 *         console.log('Final configuration:', config);
 *     })
 *     .catch(error => {
 *         console.error('Error configuring:', error);
 *     });
 */

export async function configuration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
    let config = setCliConfiguration(cli);

    if (existsSync(configFile)) {
        const userConfig = await parseConfigurationFile(configFile);

        if (userConfig) {
            config = {
                ...config,
                ...userConfig
            };
        }
    }

    return config;
}
