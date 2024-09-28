/**
 * Import will remove at compile time
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json'};

/**
 * Config build
 */

const config: Array<xBuildConfig> = [
    {
        declaration: true,
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
            sourceRoot: `https://github.com/remotex-lab/xjet/tree/v${ pkg.version }/`,
            entryPoints: {
                index: 'src/index.ts'
            }
        }
    },
    {
        esbuild: {
            platform: 'browser',
            packages: 'bundle',
            sourcemap: 'external',
            preserveSymlinks: true,
            entryPoints: {
                banner: 'src/banner.ts'
            }
        }
    }
];

export default config;
