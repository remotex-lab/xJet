#!/usr/bin/env node

/**
 * Import will remove at compile time
 */

import type { VMRuntimeError } from '@errors/vm-runtime.error';
import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import '@errors/stack.error';
import '@errors/uncaught.error';
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

run().catch((error: VMRuntimeError) => {
    console.error(error.stack);
});
