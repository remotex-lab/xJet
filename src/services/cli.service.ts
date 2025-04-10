/**
 * Import will remove at compile time
 */

import type { CliOptionsInterface } from '@services/interfaces/cli-service.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { resolve } from 'path';
import { hideBin } from 'yargs/helpers';
import { bannerComponent } from '@components/banner.component';

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
 * @see CliOptionsInterface
 *
 * @since 1.0.0
 */

export function parseArguments(argv: Array<string>): CliOptionsInterface {
    const parser = yargs(hideBin(argv));
    const originalShowHelp = parser.showHelp;
    parser.showHelp = function(consoleFunction?: string | ((s: string) => void)) {
        console.log(bannerComponent());

        return originalShowHelp.call(this, <(s: string) => void> consoleFunction);
    };


    const cli = parser
        .usage('Usage: xJet [files..] [options]')
        .command('* [files..]', 'Specific test files to run (supports glob patterns)', (yargs) => {
            return yargs.positional('files', {
                describe: 'Specific test files to run (supports glob patterns)',
                type: 'string',
                array: true
            });
        })
        .options({
            files: {
                describe: 'Specific test files to run (supports glob patterns)',
                type: 'string',
                array: true
            },
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
                type: 'string',
                array: true
            },
            suites: {
                alias: 's',
                describe: 'Filter pattern for test suite files',
                type: 'string',
                array: true
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
                alias: 'w',
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
            randomize: {
                describe: 'Random tests order',
                type: 'boolean'
            },
            silent: {
                describe: 'Suppress all console output',
                type: 'boolean'
            },
            showBanner: {
                describe: 'Show banner output',
                type: 'boolean',
                default: true
            }
        })
        .example('xJet --config ./xjet.config.ts', 'Run tests with custom configuration')
        .example('xJet --filter "auth.*" --verbose', 'Run auth-related tests with verbose logging')
        .example('xJet --suites "src/**/*.test.ts"', 'Run specific test suites')
        .example('xJet "src/**/*.test.ts"', 'Run specific test suites')
        .example('xJet --watch --coverage', 'Run tests in watch mode with coverage')
        .epilogue('For more information, check the documentation')
        .help()
        .alias('help', 'h')
        .version()
        .strict()
        .parseSync();

    return <CliOptionsInterface> cli;
}
