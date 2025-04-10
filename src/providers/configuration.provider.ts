/**
 * Import will remove at compile time
 */

import type { CliOptionsInterface } from '@services/interfaces/cli-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { defaultConfiguration } from '@configuration/default.configuration';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Loads and merges the configuration settings from a file and CLI options.
 *
 * @param configFile - The path to the configuration file, Defaults to an empty string if not provided.
 * @param cli - The CLI options to override or extend the default and file-based configurations.
 * @returns A promise that resolves to the merged configuration object.
 *
 * @remarks This method combines the default configuration, file-based configuration (if provided and valid),
 * and CLI options into a single configuration object.
 *
 * @see CliOptionsInterface
 * @see ConfigurationInterface
 * @see parseConfigurationFile
 *
 * @since 1.0.0
 */

export async function configuration(configFile: string = '', cli: CliOptionsInterface): Promise<ConfigurationInterface> {
    let config = { ...defaultConfiguration };
    if (configFile && existsSync(configFile)) {
        const userConfig = await parseConfigurationFile(configFile);
        if (userConfig) {
            config = {
                ...config,
                ...userConfig,
                exclude: [ ...(config.exclude ?? []), ...(userConfig.exclude ?? []) ]
            };
        }
    }

    return <ConfigurationInterface> { ...config, ...cli };
}
