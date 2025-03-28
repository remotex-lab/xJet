/**
 * Import will remove at compile time
 */

import type { FrameworkPaths } from '@providers/interfaces/framework-provider.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SourceService } from '@remotex-labs/xmap';

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
 * global, and configuration source maps, as well as determines root directory paths for file management.
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
     * Source map service for global source operations.
     * @since 1.0.0
     */

    private globalSourceMap?: SourceService;

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

    get configuration(): SourceService | undefined {
        return this.configurationSourceMap;
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
     * Returns the global source map service.
     * Initializes the service on first access if not already initialized.
     *
     * @returns The global SourceService instance
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * const globalSourceMap = provider.global;
     * const file = globalSourceMap.file;
     * ```
     *
     * @see SourceService
     *
     * @since 1.0.0
     */

    get global(): SourceService {
        if (!this.globalSourceMap) {
            this.globalSourceMap = this.initializeFileSourceMap(GLOBAL_SOURCE_MAP_PATH);
        }

        return this.globalSourceMap!;
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
     * Checks if the path corresponds to either the framework or global source files.
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
        return filePath === this.framework.file || filePath === this.global.file;
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
        if(filePath === this.global.file)
            return this.global;

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
        const path = dirname(fileURLToPath(import.meta.url));

        return {
            root: cwd(),
            dist: dirname(path),
            framework: dirname(dirname(path))
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
}
