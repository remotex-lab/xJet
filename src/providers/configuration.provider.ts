/**
 * Import will be removed at compile time.
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@services/interfaces/cli.interface';
import type { ConfigurationInterface, PartialConfigurationsType } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { defaultConfiguration } from '@configuration/default.configuration';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Parses CLI arguments and generates a partial configuration object.
 *
 * This function extracts relevant properties from the command-line arguments
 * and returns a partial configuration object based on the values provided in `cli`.
 * Undefined values are filtered out, ensuring that only explicitly defined arguments
 * are included in the final configuration.
 *
 * @param cli - An instance of `Argv<ArgvInterface>` that contains CLI arguments and options.
 * @returns A partial configuration object as `Partial<ConfigurationInterface>`,
 *          containing only the properties explicitly defined in the CLI arguments.
 *
 * @example
 * ```ts
 * import yargs from 'yargs';
 *
 * const argv = yargs(process.argv.slice(2)).argv as Argv<ArgvInterface>;
 * const cliConfig = parseCliArgs(argv);
 * console.log(cliConfig); // Outputs the parsed configuration from CLI arguments.
 * ```
 */

function parseCliArgs(cli: Argv<ArgvInterface>): PartialConfigurationsType {
    const args = <ArgvInterface> cli.argv;

    // Helper function to filter out undefined values
    const pickDefined = <T extends object>(obj: T): PartialConfigurationsType => Object.fromEntries(
        Object.entries(obj).filter(([ , value ]) => value !== undefined)
    );

    return pickDefined<PartialConfigurationsType>({
        match: args.match,
        color: args.color,
        watch: args.watch,
        root: args.rootDir,
        logLevel: args.logLevel,
        external: args.external,
        packages: args.packages
    });
}

/**
 * Combines default configuration, CLI arguments, and a configuration file
 * to produce the final configuration for the application.
 *
 * This function initializes the configuration with default values and overrides them
 * with CLI arguments and, if specified, values from a configuration file.
 * If the file exists, `parseConfigurationFile` is used to read and merge its values.
 * Critical configuration properties are validated to ensure the final configuration's integrity.
 *
 * @param configFile - The path to the configuration file to read and merge with CLI arguments.
 *                     This file should be in a format that can be parsed by `parseConfigurationFile`.
 * @param cli - An instance of `Argv<ArgvInterface>` containing CLI arguments and options.
 *
 * @returns A promise that resolves to the final `ConfigurationInterface` object, combining defaults,
 *          CLI arguments, and configuration file values.
 *
 * @throws Error - Throws an error if critical configuration properties, such as `entryPoints`,
 *                 are missing from the final configuration.
 *
 * @see {@link ../configuration/parse.configuration.ts} for the function that parses the configuration file.
 *
 * @example
 * ```ts
 * import yargs from 'yargs';
 * import { configuration } from './path-to-your-function';
 *
 * const argv = yargs(process.argv.slice(2)).argv as Argv<ArgvInterface>;
 *
 * configuration('path/to/config/file.json', argv)
 *     .then(config => {
 *         console.log('Final configuration:', config);
 *     })
 *     .catch(error => {
 *         console.error('Error configuring:', error);
 *     });
 * ```
 */

export async function configuration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
    const cliConfig = parseCliArgs(cli);
    const userConfig = existsSync(configFile) ? await parseConfigurationFile(configFile) : {};

    return {
        ...defaultConfiguration,
        ...userConfig,
        ...cliConfig
    };
}
