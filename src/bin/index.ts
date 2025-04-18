#!/usr/bin/env node

/**
 * Imports
 */

import '@errors/uncaught.error';
import { parseArguments } from '@services/cli.service';
import { getReporter } from '@handler/reporter.handler';
import { SuitesService } from '@services/suites.service';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';

/**
 * Main entry point for the xJet library.
 *
 * @since 1.0.0
 */

async function main(argv: Array<string>) {
    const cli = parseArguments(argv);
    if (cli.showBanner) console.log(bannerComponent());

    const config = await configuration(cli.config, cli);
    const reporter = await getReporter(config);
    const suites = new SuitesService(config, reporter);
    await suites.executeSuite();
}

/**
 * Run entrypoint of xJet cli
 */

main(process.argv).catch((error: unknown) => {
    if(error) console.error(error);
    process.exit(1);
});
