#!/usr/bin/env node

/**
 * Imports
 */

import '@errors/uncaught.error';
import { parseArguments } from '@services/cli.service';
import { SuitesService } from '@services/suites.service';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';

/**
 * Banner
 */

console.log(bannerComponent());

/**
 * Main
 */

async function main(argv: Array<string>) {
    const cli = parseArguments(argv);
    const config = await configuration(cli.config, cli);
    const suites = new SuitesService(config);

    await suites.executeSuite();
}

/**
 * Run entrypoint of xJet cli
 */

main(process.argv).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
