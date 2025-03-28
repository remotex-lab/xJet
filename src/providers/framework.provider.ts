/**
 * Import will remove at compile time
 */

import type { FrameworkPaths } from '@providers/interfaces/framework-provider.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { F_OK } from 'constants';
import { fileURLToPath } from 'url';
import { accessSync, readFileSync } from 'fs';
import { SourceService } from '@remotex-labs/xmap';
import { basename, dirname, join, normalize, parse } from 'path';

/**
 * Constants
 */

const GLOBAL_SOURCE_MAP_PATH = 'index.js.map';
const FRAMEWORK_SOURCE_MAP_PATH = 'bin/index.js.map';
const SOURCE_SERVICE_INITIALIZATION_ERROR = 'Failed to initialize SourceService';

/**
 * Provides centralized access to framework-specific configurations, paths, and source maps.
 * This singleton class ensures that the entire application operates with consistent framework resources.
 *
 * @remarks
 * The FrameworkProvider uses the singleton pattern to guarantee a single source of truth for
 * framework configuration throughout the application. It initializes and manages the framework,
 * shared, and configuration source maps, as well as determines root directory paths for file management.
 * This centralization helps maintain consistency and reduces duplication across the codebase.
 *
 * @see FrameworkPaths - Interface defining the path structure used by the provider
 * @see SourceService - Utility class used for source map operations
 *
 * @since 1.0.0
 */

export class FrameworkProvider {
    /**
     * Singleton instance of the FrameworkProvider.
     * @since 1.0.0
     */

    private static instance: FrameworkProvider;

    /**
     * Source map service for shared source operations.
     * @since 1.0.0
     */

    private sharedSourceMap?: SourceService;

    /**
     * Source map service for framework-specific operations.
     * @since 1.0.0
     */

    private frameworkSourceMap?: SourceService;

    /**
     * Source map service for configuration operations.
     * @since 1.0.0
     */

    private configurationSourceMap?: SourceService;

    /**
     * Framework-related paths used throughout the application.
     * @since 1.0.0
     */

    private readonly frameworkPaths: FrameworkPaths;

    /**
     * Creates a new FrameworkProvider instance and initializes paths.
     * Implements the singleton pattern with private constructor.
     *
     * @internal
     * @since 1.0.0
     */

    private constructor() {
        this.frameworkPaths = this.initializePaths();
    }

    /**
     * Returns the singleton instance of the FrameworkProvider.
     * Creates a new instance if it doesn't exist yet.
     *
     * @returns The FrameworkProvider instance
     *
     * @example
     * ```ts
     * const frameworkProvider = FrameworkProvider.getInstance();
     * const paths = frameworkProvider.paths;
     * ```
     *
     * @see FrameworkPaths - The path structure returned by the paths getter
     *
     * @since 1.0.0
     */

    static getInstance(): FrameworkProvider {
        if (!FrameworkProvider.instance) {
            FrameworkProvider.instance = new FrameworkProvider();
        }

        return FrameworkProvider.instance;
    }

    /**
     * Returns the framework paths structure.
     *
     * @returns The FrameworkPaths object containing root, dist, and framework paths
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const { root, dist, framework } = provider.paths;
     * console.log(`Root path: ${root}`);
     * ```
     *
     * @see FrameworkPaths - Interface defining the path structure
     *
     * @since 1.0.0
     */

    get paths(): FrameworkPaths {
        return this.frameworkPaths;
    }

    /**
     * Returns the configuration source map service.
     *
     * @returns The configuration SourceService instance or undefined if not initialized
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const configSource = provider.configuration;
     * if (configSource) {
     *   const sourceData = configSource.getSource();
     * }
     * ```
     *
     * @see SourceService - The source map service used for configuration
     *
     * @since 1.0.0
     */

    get configuration(): SourceService {
        return <SourceService> this.configurationSourceMap;
    }

    /**
     * Sets the configuration source map service.
     *
     * @param value - The SourceService instance to use for configuration
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const configSourceMap = new SourceService(...);
     * provider.configuration = configSourceMap;
     * ```
     *
     * @see SourceService
     *
     * @since 1.0.0
     */

    set configuration(value: SourceService) {
        this.configurationSourceMap = value;
    }

    /**
     * Returns the shared source map service.
     * Initializes the service on first access if not already initialized.
     *
     * @returns The shared SourceService instance
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const sharedSourceMap = provider.shared;
     * const file = sharedSourceMap.file;
     * ```
     *
     * @see SourceService
     *
     * @since 1.0.0
     */

    get shared(): SourceService {
        if (!this.sharedSourceMap) {
            this.sharedSourceMap = this.initializeFileSourceMap(GLOBAL_SOURCE_MAP_PATH);
        }

        return this.sharedSourceMap!;
    }

    /**
     * Returns the framework source map service.
     * Initializes the service on first access if not already initialized.
     *
     * @returns The framework SourceService instance
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const frameworkSourceMap = provider.framework;
     * const file = frameworkSourceMap.file;
     * ```
     *
     * @see SourceService - The source map service for framework operations
     * @see FRAMEWORK_SOURCE_MAP_PATH - The path to the framework source map file
     *
     * @since 1.0.0
     */

    get framework(): SourceService {
        if (!this.frameworkSourceMap) {
            this.frameworkSourceMap = this.initializeFileSourceMap(FRAMEWORK_SOURCE_MAP_PATH);
        }

        return this.frameworkSourceMap!;
    }

    /**
     * Determines if the provided file path belongs to a framework source file.
     * Checks if the path corresponds to either the framework or shared source files.
     *
     * @param filePath - The file path to check
     * @returns True if the file is a framework source file, false otherwise
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const isFramework = provider.isFrameworkSourceFile('/path/to/file.js');
     * if (isFramework) {
     *   console.log('This is a framework source file');
     * }
     * ```
     *
     * @since 1.0.0
     */

    isFrameworkSourceFile(filePath?: string): boolean {
        return filePath === this.framework.file || filePath === this.shared.file;
    }

    /**
     * Determines whether a given source file belongs to the shared source or framework.
     *
     * @param source - The file path to check
     * @returns True if the source file is part of the framework or shared source, false otherwise
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const isShared = provider.isSharedSourceFile('/path/to/file.ts');
     * if (isShared) {
     *   console.log('This is a shared source file');
     * }
     * ```
     *
     * @since 1.0.0
     */

    isSharedSourceFile(source: string): boolean {
        const normalizeSource = normalize(source);

        return normalizeSource.includes(this.paths.framework) ||
            (this.shared.sourceRoot !== null && source.includes(this.shared.sourceRoot));
    }

    /**
     * Returns the appropriate source map service for the given file path.
     *
     * @param filePath - The file path to get the source map for
     * @returns The corresponding SourceService instance
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const sourceMap = provider.getFrameworkSourceMap('/path/to/file.js');
     * const sourceData = sourceMap.getSource();
     * ```
     *
     * @see SourceService - The returned source map service class
     *
     * @since 1.0.0
     */

    getFrameworkSourceMap(filePath?: string): SourceService {
        if (filePath === this.shared.file)
            return this.shared;

        return this.framework;
    }

    /**
     * Determines the root directory based on whether the file is a framework source file.
     *
     * @param filePath - The file path to check
     * @returns The root directory path as a string
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const rootDir = provider.getRootDirectory('/path/to/file.js');
     * console.log(`Using root directory: ${rootDir}`);
     * ```
     *
     * @see isFrameworkSourceFile - Method used to determine if file belongs to framework
     * @see FrameworkPaths - Contains the path properties returned by this method
     *
     * @since 1.0.0
     */

    getRootDirectory(filePath?: string): string {
        return this.isFrameworkSourceFile(filePath)
            ? this.frameworkPaths.framework
            : this.frameworkPaths.root;
    }

    /**
     * Checks if a file or directory exists at the specified path.
     *
     * @param path - The filesystem path to check for existence
     * @returns True if the path exists, false otherwise
     *
     * @throws Error - May throw if permissions are insufficient to check the path
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * if (provider.pathExists('/path/to/check')) {
     *   console.log('Path exists');
     * }
     * ```
     *
     * @since 1.0.0
     */

    pathExists(path: string): boolean {
        try {
            accessSync(path, F_OK);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Initializes the framework paths structure.
     * Determines the root, dist, and framework paths based on the current execution context.
     *
     * @returns The initialized FrameworkPaths object
     *
     * @example
     * ```ts
     * const paths = provider.initializePaths();
     * console.log(`Root directory: ${paths.root}`);
     * ```
     *
     * @internal
     * @see FrameworkPaths - The structure being initialized
     *
     * @since 1.0.0
     */

    private initializePaths(): FrameworkPaths {
        const dist = this.getDistPath();

        return {
            root: cwd(),
            dist: dist,
            framework: dirname(dist)
        };
    }

    /**
     * Initializes a SourceService from a source map file.
     *
     * @param path - The path to the source map file
     * @returns The initialized SourceService instance
     * @throws Error when source map initialization fails
     *
     * @example
     * ```ts
     * const sourceMap = this.initializeFileSourceMap('path/to/map.js.map');
     * const sourceData = sourceMap.getSource();
     * ```
     *
     * @internal
     * @see SourceService - The class being instantiated
     * @see initializeSourceService - The helper method used for creating the SourceService
     *
     * @since 1.0.0
     */

    private initializeFileSourceMap(path: string): SourceService {
        try {
            const sourceMapPath = join(this.frameworkPaths.dist, path);
            const sourceMapData = readFileSync(sourceMapPath);

            return this.initializeSourceService(sourceMapData.toString(), sourceMapPath);
        } catch (error) {
            throw new Error(
                `${ SOURCE_SERVICE_INITIALIZATION_ERROR }: ${ error instanceof Error ? error.message : String(error) }`
            );
        }
    }

    /**
     * Creates a new SourceService instance from source map data.
     *
     * @param sourceMap - The source map string data
     * @param path - The path to the source file
     * @returns The initialized SourceService instance
     * @throws Error when SourceService creation fails
     *
     * @example
     * ```ts
     * const sourceMapData = readFileSync('path/to/map.js.map').toString();
     * const sourceService = this.initializeSourceService(sourceMapData, 'path/to/file.js');
     * ```
     *
     * @internal
     * @see SourceService - The class being instantiated
     *
     * @since 1.0.0
     */

    private initializeSourceService(sourceMap: string, path: string): SourceService {
        try {
            return new SourceService(sourceMap, path.replace(/\.map$/, ''));
        } catch (error) {
            throw new Error(
                `${ SOURCE_SERVICE_INITIALIZATION_ERROR }: ${ error instanceof Error ? error.message : String(error) }`
            );
        }
    }

    /**
     * Locates the 'dist' directory by traversing up from the current file's location
     *
     * @returns The absolute path to the 'dist' directory
     * @throws Error when 'dist' directory cannot be found within the maximum search depth
     *
     * @remarks
     * This method attempts to find the distribution directory by:
     * 1. Checking if the current file is already in a 'dist' directory
     * 2. If not, traversing up the directory tree to a maximum depth of 10 levels
     * 3. Returning the absolute path when found
     *
     * The method uses ESM's import.meta.url to get the current file's location,
     * ensuring compatibility with ES modules. The search is bounded to prevent
     * infinite loops when running in unusual directory structures.
     *
     * @example
     * ```ts
     * class MyClass {
     *   constructor() {
     *     try {
     *       const distPath = this.getDistPath();
     *       console.log(`Distribution directory found at: ${distPath}`);
     *     } catch (error) {
     *       console.error(`Failed to locate dist directory: ${error.message}`);
     *     }
     *   }
     *
     *   private getDistPath(): string {
     *     // Method implementation
     *   }
     * }
     * ```
     *
     * @private
     * @since 1.0.0
     */

    private getDistPath(): string {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        if (basename(currentDir) === 'dist')
            return currentDir;

        // Use a defined maximum depth to prevent infinite loops
        const MAX_DEPTH = 10;
        let depth = 0;

        // Start searching from current directory and move upwards
        let searchDir = currentDir;
        const rootDir = parse(currentDir).root;

        // Continue until we either find 'dist' or reach the filesystem root
        while (searchDir !== rootDir && depth < MAX_DEPTH) {
            searchDir = dirname(searchDir);
            depth++;

            if (basename(searchDir) === 'dist') {
                return searchDir;
            }

            const potentialDistPath = join(searchDir, 'dist');
            if(this.pathExists(potentialDistPath)) {
                return potentialDistPath;
            }
        }

        // If we couldn't find the dist directory, provide a helpful error message
        throw new Error(
            `Could not find 'dist' directory within ${ MAX_DEPTH } levels up from ${ currentDir }`
        );
    }
}
