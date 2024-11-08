/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { defaultReporter } from '@reports/default.reporter';
import { adapterInit, adapterRequest } from '@adapters/default.adapter';

/**
 * The default configuration for the testing framework.
 *
 * This object provides the default settings for running tests, including file matching patterns, logging levels,
 * external dependencies, and the reporter and adapter configurations. It is based on the `ConfigurationInterface`
 * and can be used to quickly initialize the testing framework with reasonable defaults.
 *
 * The `defaultConfiguration` is automatically set up with:
 * - The current working directory as the root directory for test files.
 * - Color output enabled.
 * - Watch mode disabled.
 * - A default empty array for test file patterns.
 * - A `silent` log level (no output).
 * - No external dependencies bundled.
 * - A default reporter and adapter initialization and request functions.
 *
 * This configuration can be overridden or extended as needed.
 *
 * @example
 * ```ts
 * // Accessing the default configuration
 * const config = defaultConfiguration;
 * console.log(config.root); // Output: The current working directory (e.g., '/home/user/project')
 * console.log(config.color); // Output: true
 * console.log(config.logLevel); // Output: 'silent'
 * ```
 */

export const defaultConfiguration: ConfigurationInterface = {
    root: cwd(),
    color: true,
    watch: false,
    match: [
        'src/**/*.spec.js',
        'src/**/*.spec.ts'
    ],
    logLevel: 'silent',
    external: [],
    packages: 'bundle',
    reporter: defaultReporter,
    adapterInit: adapterInit,
    adapterRequest: adapterRequest
};
