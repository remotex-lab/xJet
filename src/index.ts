#!/usr/bin/env node

/**
 * Import will remove at compile time
 */

import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import { argvParser } from '@services/cli.service';
import { configuration } from './providers/configuration.provider';

/**
 * Main run
 */

async function run() {
    const cli = argvParser(process.argv);
    const args = <ArgvInterface> cli.argv;
    const config = await configuration(args.config, cli);
    console.log(config);
    // const specFiles = await resolveSpecFiles(config);
    // const dispatcher = new SuiteDispatcherService(config, specFiles);

    // await dispatcher.run();
}

/**
 * Run
 */

// run().catch((error: VMRuntimeError & xBuildError) => {
run().catch((error: any) => {
    console.error(error.stack);
});
