/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { bannerComponent } from '@components/banner.component';


/**
 * Parses command-line arguments into an `ArgvInterface` object using `yargs`.
 *
 * This function configures `yargs` to handle various build-related options for a JavaScript and TypeScript toolchain.
 * It returns an object that adheres to the `ArgvInterface` structure based on the parsed arguments.
 * The available options include file selection, matching patterns, logging, watching mode, and configuration for test execution.
 *
 * @param argv - An array of command-line arguments (e.g., `process.argv`).
 *
 * @returns An object representing the parsed command-line arguments, with properties based on the provided configuration.
 *
 * @see {@link ArgvInterface} for the structure of the returned object.
 *
 * @example
 * ```ts
 * // Example usage:
 * const args = argvParser(process.argv);
 * console.log(args.file); // Output: the file to build
 * console.log(args.match); // Output: glob patterns for locating test files
 * console.log(args.watchMode); // Output: true or false based on the --watchMode flag
 *
 * // Example of passing command line arguments:
 * // node yourScript.js --match '**\/*.test.ts' --color
* // This will output:
* // { file: undefined, match: ['**\/*.test.ts'], color: true, ... }
 * ```
*/

export function argvParser(argv: Array<string>): Argv<ArgvInterface> {
    const cli = yargs(hideBin(argv))
        .command('$0 [files]', 'A versatile TypeScript and JavaScript testing framework.', (yargs) => {
            yargs
                .positional('file', {
                    type: 'string',
                    describe: 'Specific test file to run'
                })
                .option('match', {
                    type: 'array',
                    alias: 'm',
                    description: 'Array of glob patterns used to locate test files.'
                })
                .option('watch', {
                    type: 'boolean',
                    alias: 'w',
                    description: 'Enables or disables watch mode for test execution.'
                })
                .option('root', {
                    type: 'string',
                    alias: 'r',
                    description: 'The root directory for locating test files.'
                })
                .option('color', {
                    type: 'boolean',
                    description: 'Enables or disables color output in the test results.'
                })
                .option('logLevel', {
                    type: 'string',
                    description: 'Sets the logging verbosity level.',
                    choices: [ 'silent', 'error', 'warn', 'info', 'debug' ]
                })
                .option('external', {
                    type: 'array',
                    description: 'An array of external packages that should not be bundled with the tests.'
                })
                .option('packages', {
                    type: 'string',
                    description: 'Specifies how esbuild should handle packages.',
                    choices: [ 'bundle', 'external' ]
                })
                .option('reporters', {
                    type: 'string',
                    description: 'Custom reporter file (js/ts)'
                })
                .option('config', {
                    alias: 'c',
                    describe: 'xJet configuration file (js/ts)',
                    type: 'string',
                    default: 'xjet.config.ts'
                });
        })
        .help()
        .alias('help', 'h')
        .version(false) // Disable the default version behavior
        .middleware((argv) => {
            if (argv.version) {
                console.log(bannerComponent());
                process.exit(0);
            }
        });

    cli.showHelp((helpText) => {
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            console.log(bannerComponent());
            console.log(helpText + '\n\n');
            process.exit(0);
        }
    });

    return <Argv<ArgvInterface>> cli;
}
