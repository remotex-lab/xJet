#!/usr/bin/env node

/**
 * Exports
 */

export type * from './xJet';
export type * from '@adapters/interfaces/adapter.interface';
export type * from '@configuration/interfaces/configuration.interface';

/**
 * Import will remove at compile time
 */

import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { argvParser } from '@services/cli.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';
import { resolveSpecFiles } from '@components/spec-file.component';
import { SuiteDispatcherService } from '@services/suite-dispatcher.service';

/**
 * Log banner
 */

global.__ACTIVE_COLOR = true;
console.log(bannerComponent());

/**
 * Main run
 */

async function run() {
    const cli = argvParser(process.argv);
    const args = <ArgvInterface> cli.argv;
    const config = await configuration(args.config, cli);
    const specFiles = await resolveSpecFiles(config);
    const dispatcher = new SuiteDispatcherService(config, specFiles);

    await dispatcher.run();
}

/**
 * Run entrypoint of xBuild
 */

run().catch((error: Error | BaseError) => {
    if (error instanceof BaseError)
        return console.error(error.toString());

    console.error((new VMRuntimeError(error)).toString());
});

