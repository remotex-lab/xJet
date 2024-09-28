/**
 * Import will remove at compile time
 */

import type { SpecFilesInterface } from '@components/interfaces/spec-file.interface';
import type { ConfigurationInterface, FilePatterns } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import fs from 'fs';
import { cwd } from 'process';
import { join, relative } from 'path';
import { xJetError } from '@errors/xjet.error';
import { transpileFiles } from '@services/transpiler.service';

/**
 * Size of empty source map
 */

export const SIZE_OF_EMPTY_MAP = 93;
export const SIZE_OF_EMPTY_CODE = 34;

/**
 * Converts a glob-like pattern to a regex.
 *
 * This function takes a pattern such as `*.spec.ts` and converts it to a regex
 * that matches file names in a similar way.
 *
 * @param pattern - The glob pattern to convert (e.g., `*.spec.ts`).
 * @returns A regex that can be used to match file names.
 *
 * @example
 * const regex = globToRegex('*.spec.ts');
 * console.log(regex); // Output: /^.*\.spec\.ts$/
 */

export function globToRegex(pattern: string): RegExp {
    // Escape special characters and convert glob symbols to regex equivalents
    const regexString = pattern
        .replace(/[.+^$|[\]\\]/g, '\\$&')    // Escape special regex characters
        .replace(/\*\*/g, '.*')                 // Convert ** to .*
        .replace(/\*/g, (match, offset, fullString) => {
            // Only replace * if it’s not prefixed by a '.'
            return fullString[offset - 1] === '.' ? '*' : '[^/]*';
        })
        .replace(/\?/g, '.')                    // Convert ? to .
        .replace(/\{([^}]+)\}/g, (_, choices) => `(${ choices.split(',').join('|') })`); // Convert {a,b} to (a|b)

    return new RegExp(`^${regexString}$`);
}

/**
 * Formats the key from the spec file path.
 *
 * @param filePath - The full path of the spec file.
 * @param baseDir - The base directory to remove from the path.
 * @returns The formatted key string.
 */

function formatKey(filePath: string, baseDir: string): string {
    return filePath
        .replace('.map', '')
        .replace('.js', '')
        .replace(join(baseDir, '/'), '')
        .replaceAll('\\', '/');
}

/**
 * Checks whether a file path matches any pattern in the provided array of patterns.
 *
 * @param filePath - The file path to be checked.
 * @param patterns - Array of patterns (glob-like strings or RegExp) to match against.
 * @returns true if the file matches at least one of the patterns.
 */

function matchesPatterns(filePath: string, patterns: FilePatterns): boolean {
    return patterns.some(pattern => {
        if (typeof pattern === 'string')
            pattern = globToRegex(pattern);

        return pattern.test(filePath);
    });
}

/**
 * Updates the SpecFilesInterface result with the transpiled code and source map.
 *
 * @param result - The result object to update.
 * @param key - The key for the spec file.
 * @param text - The transpiled code or source map text.
 * @param isMap - A boolean indicating if the current spec is a source map.
 */

function updateSpecFilesResult(
    result: SpecFilesInterface,
    key: string,
    text: string,
    isMap: boolean
): void {
    if ((isMap && text.length <= SIZE_OF_EMPTY_MAP) || !text || text.length <= SIZE_OF_EMPTY_CODE) {
        return;
    }

    if (!result[key]) {
        result[key] = {
            code: '',
            sourceMap: ''
        };
    }

    if (isMap) {
        result[key].sourceMap = text;
    } else {
        result[key].code = text;
    }
}

/**
 * Recursively gets spec files from the given directory based on the include and exclude patterns.
 *
 * @param dir - The root directory to search for spec files.
 * @param config - Configuration object containing include and exclude patterns.
 * @returns A record of file paths that match the include and exclude criteria.
 */

export function getSpecFiles(dir: string, config: ConfigurationInterface): Record<string, string> {
    let specFiles: Record<string, string> = {};
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = join(dir, file);
        const relativeFilePath = relative(process.cwd(), fullPath).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);

        // If it's a directory, recurse into it unless it's excluded
        if (stat.isDirectory()) {
            if (!matchesPatterns(relativeFilePath, config.exclude)) {
                specFiles = { ...specFiles, ...getSpecFiles(fullPath, config) };
            }
        } else {
            // Include files matching the include patterns and not excluded by the exclude patterns
            if (matchesPatterns(relativeFilePath, config.include) && !matchesPatterns(relativeFilePath, config.exclude)) {
                specFiles[fullPath] = fullPath;
            }
        }
    }

    return specFiles;
}

/**
 * Resolves and transpiles specification files based on the provided configuration.
 *
 * This function searches for spec files that match the inclusion criteria specified
 * in the `ConfigurationInterface` and excludes any files that match the exclusion criteria.
 * It then transpiles the found files and returns an object containing the transpiled code
 * and source maps.
 *
 * @param {ConfigurationInterface} config - The configuration object containing `include` and `exclude` patterns
 * for identifying spec files.
 * @returns {Promise<SpecFilesInterface>} A promise that resolves to an object containing the resolved
 * specification files, with each key representing a file path and its associated value containing
 * the transpiled code and source map.
 *
 * @throws {xJetError} Throws an error if no spec files are found that match the inclusion criteria.
 *
 * @example
 * const config = {
 *     include: ['*.spec.ts', 'src/**\/*.spec.ts'],
 *     exclude: ['node_modules']
 * };
 *
 * resolveSpecFiles(config)
 *     .then(result => {
 *         console.log('Resolved Spec Files:', result);
 *     })
 *     .catch(error => {
 *         console.error('Error resolving spec files:', error);
 *     });
 */

export async function resolveSpecFiles(config: ConfigurationInterface): Promise<SpecFilesInterface> {
    const result: SpecFilesInterface = {};
    const specFilesPaths = getSpecFiles(cwd(), config);
    const specFiles = await transpileFiles(specFilesPaths, {
        outdir: '.',
        banner: {
            js: '(function() {'
        },
        footer: {
            js: '})();'
        },
        external: config.external,
        packages: config.packages
    });

    if (!specFiles.outputFiles || specFiles.outputFiles.length < 1)
        throw new xJetError(`No spec files found matching the search criteria: '${ config.include }'.`);

    for (const spec of specFiles.outputFiles) {
        const isMap = spec.path.endsWith('.map');
        const key = formatKey(spec.path, cwd());
        updateSpecFilesResult(result, key, spec.text, isMap);
    }

    return result;
}
