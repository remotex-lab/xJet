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

const config: Array<xBuildConfig> = [
    {
        bundleDeclaration: true,
        define: {
            __VERSION: pkg.version
        },
        esbuild: {
            bundle: true,
            minify: true,
            target: [ `node${ version.slice(1) }` ],
            outdir: 'dist',
            format: 'esm',
            platform: 'node',
            packages: 'external',
            sourcemap: true,
            sourceRoot: `https://github.com/remotex-lab/xJet/tree/v${ pkg.version }/dist/`,
            entryPoints: {
                'bin/index': 'src/bin/index.ts'
            }
        }
    }, {
        esbuild: {
            minify: false,
            packages: 'bundle',
            sourcemap: 'linked',
            minifySyntax: true,
            preserveSymlinks: true,
            minifyWhitespace: true,
            minifyIdentifiers: false,
            entryPoints: {
                'index': 'src/index.ts'
            }
        }
    }
];

export default config;
