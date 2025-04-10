/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join, relative, resolve } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { FrameworkProvider } from '@providers/framework.provider';
import { compileGlobPattern, isGlob } from '@components/glob.component';

/**
 * Provides functionalities to retrieve specification files based on configured include and exclude patterns.
 *
 * @remarks
 * This class supports traversing directories recursively, matching files through configurable glob patterns,
 * and filtering files according to user-defined inclusion and exclusion criteria.
 *
 * @example
 * ```ts
 * const config = { files: ['**\/*.spec.ts'], exclude: ['node_modules/'] };
 * const specsProvider = new SpecsProvider(config);
 *
 * const specFiles = specsProvider.getSpecFiles('./src');
 * console.log('Found specification files:', specFiles);
 * ```
 *
 * @since 1.0.0
 */

export class SpecsProvider {
    /**
     * Initializes the SpecsProvider instance with configuration settings.
     *
     * @param config - Configuration object implementing `ConfigurationInterface`
     *
     * @remarks
     * Ensure `config` contains valid patterns for files and directories as required.
     *
     * @since 1.0.0
     */

    constructor(private config: ConfigurationInterface) {
    }

    /**
     * Checks if a value matches any of the provided RegExp patterns.
     *
     * @param value - String to test against patterns
     * @param patterns - Array of RegExp patterns
     * @returns True if value matches any pattern
     *
     * @private
     */

    static matchesAnyRegex(value: string, patterns: Array<RegExp>): boolean {
        return patterns.some(pattern => pattern.test(value));
    }

    /**
     * Compiles an array of pattern strings or RegExp into RegExp objects.
     *
     * @param patterns - Array of string patterns or RegExp objects
     * @returns Array of compiled RegExp objects
     *
     * @private
     */

    static compilePatterns(patterns: Array<string | RegExp>): Array<RegExp> {
        return patterns.map(pattern => {
            if (pattern instanceof RegExp) {
                return pattern;
            }

            if (isGlob(pattern)) {
                return compileGlobPattern(pattern);
            }

            // For literal paths, escape special regex characters and create exact match pattern
            const escapedPattern = resolve(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            return new RegExp(`^${ escapedPattern }$`);
        });
    }

    /**
     * Recursively retrieves spec files matching configured patterns.
     *
     * @param dir - The directory path to scan for spec files
     * @returns A record of spec files, where keys represent relative paths and values their absolute file paths
     *
     * @since 1.0.0
     */

    getSpecFiles(dir: string): Record<string, string> {
        const suites = SpecsProvider.compilePatterns(this.config.suites ?? []);
        const patterns = SpecsProvider.compilePatterns(this.config.files ?? []);
        const excludes = SpecsProvider.compilePatterns(this.config.exclude ?? []);

        return this.collectFilesFromDir(dir, patterns, excludes, suites);
    }

    /**
     * Collects files from a directory recursively, filtering based on the provided patterns.
     *
     * @param dir - Directory to scan
     * @param patterns - Patterns to match files against
     * @param excludes - Patterns to exclude files
     * @param suites - Optional suite patterns for further filtering
     * @returns Record of matching spec files
     *
     * @private
     */

    private collectFilesFromDir(dir: string, patterns: Array<RegExp>, excludes: Array<RegExp>, suites: Array<RegExp>): Record<string, string> {
        if (!existsSync(dir)) return {};

        const files = readdirSync(dir);
        let specFiles: Record<string, string> = {};

        for (const file of files) {
            const fullPath = join(dir, file);

            if (SpecsProvider.matchesAnyRegex(fullPath, excludes)) {
                continue;
            }

            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                specFiles = { ...specFiles, ...this.collectFilesFromDir(fullPath, patterns, excludes, suites) };
                continue;
            }

            const relativeFilePath = this.getRelativePath(fullPath);
            const allowSuite = suites.length > 0 ? SpecsProvider.matchesAnyRegex(fullPath, suites) : true;

            if (allowSuite && SpecsProvider.matchesAnyRegex(fullPath, patterns)) {
                specFiles[relativeFilePath] = fullPath;
            }
        }

        return specFiles;
    }

    /**
     * Computes a path relative to the framework root for the given fully qualified path.
     *
     * @param fullPath - Absolute filesystem path to convert
     * @returns Relative path string based on framework's configured root path
     *
     * @remarks
     * Calculates the relative path using the framework's root directory settings.
     *
     * @since 1.0.0
     */

    private getRelativePath(fullPath: string): string {
        return relative(FrameworkProvider.getInstance().paths.root, fullPath);
    }
}
