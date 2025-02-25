#!/usr/bin/env node

/**
 * Imports
 */

import { parseArguments } from '@services/cli.service';
import { bannerComponent } from '@components/banner.component';

/**
 * Banner
 */

console.log(bannerComponent());

/**
 * Main
 */

async function main(argv: Array<string>) {
    const cli = parseArguments(argv);
    console.log(cli);
}

/**
 * Run entrypoint of xJet cli
 */

main(process.argv).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
