/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { readdirSync, statSync } from 'fs';
import { join, normalize, relative } from 'path';
import { compileGlobPattern } from '@components/glob.component';
import { FrameworkProvider } from '@providers/framework.provider';

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
     * Determines if a given file path matches any provided pattern.
     *
     * @param filePath - The target file path to match against provided patterns
     * @param patterns - An array containing strings or regular expressions to use for matching
     * @returns `true` if a match is found; otherwise, `false`
     *
     * @remarks
     * This method transparently compiles string glob patterns into regular expressions for matching.
     *
     * @example
     * ```ts
     * const matches = SpecsProvider.matchesPatterns('tests/example.test.ts', ['**\/*.test.ts']);
     * console.log(matches); // Output: true
     * ```
     *
     * @since 1.0.0
     */

    static matchesPatterns(filePath: string, patterns: Array<string | RegExp>): boolean {
        return patterns.some(pattern => {

            if (typeof pattern === 'string')
                pattern = compileGlobPattern(pattern);

            return (<RegExp> pattern).test(filePath);
        });
    }

    /**
     * Recursively retrieves spec files from a specified directory based on configured inclusion/exclusion rules.
     *
     * @param dir - The directory path to scan for spec files
     * @returns A record of spec files, where keys represent relative paths and values their absolute file paths
     *
     * @remarks
     * Traverses subdirectories recursively and filters files according to provided pattern settings.
     *
     * @example
     * ```ts
     * const specFiles = specsProvider.getSpecFiles('./tests');
     * // Example output:
     * // {
     * //   'unit/example.spec.ts': '/project/tests/unit/example.spec.ts',
     * //   'integration/sample.test.ts': '/project/tests/integration/sample.test.ts'
     * // }
     * ```
     *
     * @since 1.0.0
     */

    getSpecFiles(dir: string): Record<string, string> {
        let specFiles: Record<string, string> = {};
        const files = readdirSync(dir);

        for (const file of files) {
            const fullPath = join(dir, file);
            const relativeFilePath = this.getRelativePath(fullPath);

            if (SpecsProvider.matchesPatterns(relativeFilePath, this.config.exclude)) {
                continue;
            }

            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                specFiles = { ...specFiles, ...this.getSpecFiles(fullPath) };
                continue;
            }

            if (SpecsProvider.matchesPatterns(relativeFilePath, this.config.files)) {
                if (this.shouldSkip(relativeFilePath)) continue;
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

    /**
     * Checks whether the provided file path should be skipped due to configured suite constraints.
     *
     * @param filePath - The file path to check against suite constraints
     * @returns `true` if the file path does not belong to the specified suites; otherwise, `false`
     *
     * @remarks
     * Evaluates given file paths against configured test suite patterns. If no suites are specified, files are not skipped.
     *
     * @since 1.0.0
     */

    private shouldSkip(filePath: string): boolean {
        if (!this.config.suites || this.config.suites.length < 1)
            return false;

        const isInSuite = this.config.suites.some(pattern => {
            pattern = normalize(pattern.replace(
                join(FrameworkProvider.getInstance().paths.root, '/'), ''
            ));

            return compileGlobPattern(pattern).test(normalize(filePath));
        });

        return !isInSuite;
    }
}
