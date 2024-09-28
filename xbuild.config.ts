/**
 * Import will remove at compile time
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json' };

/**
 * Config build
 */

const config: xBuildConfig = {
    declaration: true,
    define: {
        __VERSION: pkg.version
    },
    esbuild: {
        bundle: true,
        minify: true,
        target: [ `node${ version.slice(1) }` ],
        platform: 'node',
        packages: 'external',
        sourcemap: 'external',
        sourceRoot: `https://github.com/remotex-lab/xjet/tree/${ pkg.version }/`,
        entryPoints: {
            index: 'src/index.ts',
            xJet: 'src/xJet.ts'
        }
    }
};

export default config;
