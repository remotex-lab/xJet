/**
 * Import will remove at compile time
 */

import type { CliOptionsInterface } from './interfaces/cli.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { resolve } from 'path';
import { hideBin } from 'yargs/helpers';

/**
 * Parses the command-line arguments provided to the application and
 * constructs a configuration object reflecting the CLI options.
 *
 * @param argv - The array of command-line arguments to parse (typically `process.argv`).
 * @return A `CliOptionsInterface` object containing the parsed CLI options and flags.
 *
 * @remarks
 * This function uses the `yargs` library to structure and normalize the CLI options.
 * It provides functionality for specifying configuration files, filtering test suites,
 * enabling verbose logs, collecting coverage, and applying update snapshots, among others.
 * For additional usage details, refer to the `--help` or `-h` command-line flag.
 *
 * @since 1.0.0
 */

export function parseArguments(argv: Array<string>): CliOptionsInterface {
    const cli = yargs(hideBin(argv))
        .usage('Usage: xJet [options]')
        .options({
            config: {
                alias: 'c',
                describe: 'Path to configuration file (supports .js and .ts)',
                type: 'string',
                default: 'xjet.config.ts',
                normalize: true,
                coerce: (value) => resolve(value)
            },
            filter: {
                alias: 'f',
                describe: 'Filter pattern for test names and describe blocks',
                type: 'string'
            },
            suite: {
                alias: 's',
                describe: 'Filter pattern for test suite files',
                type: 'string'
            },
            files: {
                alias: 'F',
                describe: 'Specific test files to run (supports glob patterns)',
                type: 'array'
            },
            reporter: {
                alias: 'r',
                describe: 'Test reporter to use',
                type: 'string'
            },
            verbose: {
                alias: 'v',
                describe: 'Enable verbose logging',
                type: 'boolean'
            },
            timeout: {
                alias: 't',
                describe: 'Test timeout in milliseconds',
                type: 'number'
            },
            bail: {
                alias: 'b',
                describe: 'Stop running tests after the first failure',
                type: 'boolean'
            },
            watch: {
                alias: 'W',
                describe: 'Watch mode - rerun tests on file changes',
                type: 'boolean'
            },
            coverage: {
                alias: 'C',
                describe: 'Collect test coverage',
                type: 'boolean'
            },
            update: {
                alias: 'u',
                describe: 'Update test snapshots',
                type: 'boolean'
            },
            seed: {
                describe: 'Random seed for test order',
                type: 'number'
            },
            silent: {
                describe: 'Suppress all console output',
                type: 'boolean'
            }
        })
        .example('xJet --config ./xjet.config.ts', 'Run tests with custom configuration')
        .example('xJet --filter "auth.*" --verbose', 'Run auth-related tests with verbose logging')
        .example('xJet --files "src/**/*.test.ts"', 'Run specific test files')
        .example('xJet --watch --coverage', 'Run tests in watch mode with coverage')
        .epilogue('For more information, check the documentation')
        .help()
        .alias('help', 'h')
        .version()
        .alias('version', 'V')
        .strict()
        .parseSync();

    return  <CliOptionsInterface> cli;
}
