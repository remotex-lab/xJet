/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { adapterInit, adapterRequest } from '@adapters/default.adapter';

/**
 * The default configuration options for the test.
 *
 * @example
 * ```typescript
 * import { defaultConfiguration } from '@configuration/default-configuration';
 *
 * console.log(defaultConfiguration);
 * ```
 *
 * In this example, the `defaultConfiguration` is imported and logged to the console to view the default settings.
 *
 * @public
 * @category Configuration
 */

export const defaultConfiguration: ConfigurationInterface = {
    include: [
        '**.spec.ts'
    ],
    exclude: [
        'node_modules'
    ],

    packages: 'bundle',
    external: [],
    adapterInit: adapterInit,
    adapterRequest: adapterRequest
};
