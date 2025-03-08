/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { version } from 'process';

/**
 * The default settings for configuring a testing execution environment.
 *
 * @remarks
 * This configuration includes parameters such as file patterns to include/exclude,
 * timeout settings, verbosity levels, and others necessary for test orchestration.
 * These values can typically be overridden by user-defined configurations.
 *
 * @example
 * ```ts
 * import { defaultConfiguration } from './config';
 *
 * // Using default configuration with overrides
 * const config = {
 *   ...defaultConfiguration,
 *   timeout: 10000,
 *   verbose: true
 * };
 * ```
 *
 * @see ConfigurationInterface
 * @since 1.0.0
 */

export const defaultConfiguration: Partial<ConfigurationInterface> = {
    seed: -1,
    bail: false,
    files: [ '**/*.test.ts', '**/*.spec.ts' ],
    suites: [],
    watch: false,
    silent: false,
    filter: '',
    update: false,
    timeout: 5000,
    verbose: false,
    exclude: [ 'node_modules' ],
    watchAll: false,
    reporter: 'default',
    dispatchTimeout: 2000,
    build: {
        target: [ `node${ version.slice(1) }` ],
        packages: 'bundle',
        platform: 'browser',
        external: []
    }
};
