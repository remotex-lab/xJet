/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { connectTestRunner, disconnectTestRunner, dispatchTestSuite } from '@adapters/local.adapter';

/**
 * The `defaultConfiguration` variable defines the default settings
 * to be used for configuring a testing execution environment.
 *
 * @remarks
 * This configuration includes parameters such as file patterns to include/exclude,
 * timeout settings, verbosity levels, and others necessary for test orchestration.
 * These values can typically be overridden by user-defined configurations.
 *
 * @since 1.0.0
 */

export const defaultConfiguration: ConfigurationInterface = {
    seed: -1,
    bail: false,
    files: [ '**/*.test.ts', '**/*.spec.ts' ],
    suite: '',
    watch: false,
    silent: false,
    filter: '',
    update: false,
    timeout: 5000,
    verbose: false,
    exclude: [],
    reporter: 'default',
    dispatchTestSuite,
    connectTestRunner,
    disconnectTestRunner
};
