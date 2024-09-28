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
 *
 * @param argv - An array of command-line arguments (e.g., `process.argv`).
 * @returns An object representing the parsed command-line arguments.
 *
 * @see {@link ArgvInterface} for the structure of the returned object.
 *
 * @example
 * // Example usage:
 * const args = argvParser(process.argv);
 * console.log(args.file); // Output: the file to build
 * console.log(args.dev); // Output: true or false based on the --dev flag
 */

export function argvParser(argv: Array<string>): Argv<ArgvInterface> {
    const cli = yargs(hideBin(argv))
        .command('$0 [file]', 'A versatile TypeScript and JavaScript testing framework.', (yargs) => {
            yargs
                .positional('file', {
                    describe: 'Specific test file to run',
                    type: 'string'
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

    // Custom help message with version info at the top
    cli.showHelp((helpText) => {
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            console.log(bannerComponent());
            console.log(helpText + '\n\n');
            process.exit(0); // Ensure the process exits after showing help
        }
    });

    return <Argv<ArgvInterface>> cli;
}
