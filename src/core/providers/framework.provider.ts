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

const SOURCE_MAP_FILENAME = 'index.js.map';
const BIN_SOURCE_MAP_PATH = 'bin/index.js.map';
const INITIALIZATION_ERROR = 'Failed to initialize SourceService';

/**
 * Provides a framework-specific singleton for managing paths, services, and utilities.
 * Implements a lazy initialization pattern for its single instance and related services.
 *
 * @since 1.0.0
 */

export class FrameworkProvider {
    /**
     * Provides core functionalities to register, initialize, and manage application frameworks
     * in a seamless and extensible manner.
     *
     * @since 1.0.0
     */

    private static instance: FrameworkProvider;

    /**
     * Represents the paths associated with a framework.
     *
     * @see FrameworkPaths
     * @since 1.0.0
     */

    private readonly frameworkPaths: FrameworkPaths;

    /**
     * Lazily initialized service for handling source map operations for the remote framework.
     * This service is created only when needed and cached for later uses.
     * Maps compiled code back to original source code for the test runner framework.
     *
     * @see SourceService
     * @since 1.0.0
     */

    private sourceService?: SourceService;

    /**
     * Source map service for the user configuration file
     * Provides source code mapping between compiled code and original source
     * Used for error reporting with accurate source references
     *
     * @see SourceService
     * @since 1.0.0
     */

    private configurationService?: SourceService;

    /**
     * Lazily initialized service for handling source map operations for the local binary executable.
     * This service is created only when needed and cached for later uses.
     * Maps compiled code back to original source code for the bin application.
     *
     * @see SourceService
     * @since 1.1.0
     */

    private binSourceService?: SourceService;

    /**
     * Creates a new instance of FrameworkProvider and initializes framework paths.
     *
     * @remarks
     * This constructor is private to enforce the singleton pattern.
     * It initializes the essential framework paths required for operation.
     * To get an instance of FrameworkProvider, use the `getInstance()` static method instead.
     *
     * @since 1.0.0
     */

    private constructor() {
        this.frameworkPaths = this.initializePaths();
    }

    /**
     * Retrieves the singleton instance of the `FrameworkProvider` class.
     *
     * @returns The single shared instance of `FrameworkProvider`
     *
     * @example
     * ```ts
     * const provider = FrameworkProvider.getInstance();
     * ```
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
     * Retrieves the current configuration from the source service.
     *
     * @returns The current configuration instance from the source service
     * @since 1.0.0
     */

    get configuration(): SourceService | undefined {
        return this.configurationService;
    }

    /**
     * Sets the configuration for the source service.
     *
     * @param value - The new source service configuration
     *
     * @since 1.0.0
     */

    set configuration(value: SourceService) {
        this.configurationService = value;
    }

    /**
     * Retrieves the framework paths.
     *
     * @returns The current framework paths.
     *
     * @see FrameworkPaths
     * @since 1.0.0
     */

    get paths(): FrameworkPaths {
        return this.frameworkPaths;
    }

    /**
     * Provides access to the main framework source map service, initializing it if needed.
     *
     * This property lazily creates the main source map service on first access
     * and caches it for further calls, The source map is loaded from the
     * standard distribution directory using the default source map filename.
     *
     * @returns The initialized `SourceService` instance for the main framework code.
     *
     * @throws Error - If the main source map file cannot be loaded or parsed.
     *                 The error includes details about the path and underlying issue.
     *
     * @example
     * ```ts
     * // Access the main source map service
     * const mainSourceService = frameworkProvider.sourceMap;
     *
     * // Use the service to resolve source locations
     * const sourcePosition = mainSourceService.getOriginalLocation(line, column);
     * ```
     *
     * @see initializeSourceService
     * @see SourceService
     * @since 1.0.0
     */


    get sourceMap(): SourceService {
        if (!this.sourceService) {
            this.sourceService = this.initializeSourceService(SOURCE_MAP_FILENAME);
        }

        return this.sourceService;
    }

    /**
     * Provides access to the binary application source map service, initializing it if needed.
     *
     * This property lazily creates the binary source map service on first access
     * and caches it for further calls, The source map is loaded from the
     * predefined bin directory path.
     *
     * @returns The initialized `SourceService` instance for the binary executable.
     *
     * @throws Error - If the binary source map file cannot be loaded or parsed.
     *                 The error includes details about the path and underlying issue.
     *
     * @example
     * ```ts
     * // Access the binary source map service
     * const binSourceService = frameworkProvider.binSourceMap;
     *
     * // Use the service to map compiled locations back to source
     * const originalLocation = binSourceService.getOriginalLocation(line, column);
     * ```
     *
     * @see initializeSourceService
     * @see SourceService
     * @since 1.1.0
     */

    get binSourceMap(): SourceService {
        if (!this.binSourceService) {
            this.binSourceService = this.initializeSourceService(BIN_SOURCE_MAP_PATH);
        }

        return this.binSourceService;
    }

    /**
     * Determines if the given file path corresponds to any of the framework's source files.
     *
     * @param filePath - The file path to check. This is an optional parameter.
     * @returns `true` if the provided file path matches either the main framework source file
     *          or the binary executable source file, otherwise `false`.
     *
     * @example
     * ```ts
     * // Check if a file belongs to the framework source
     * if (frameworkProvider.isFrameworkSourceFile(filePath)) {
     *   // Handle framework file case
     * } else {
     *   // Handle application file case
     * }
     * ```
     *
     * @see getFrameworkSourceMap
     * @since 1.0.0
     */

    isFrameworkSourceFile(filePath?: string): boolean {
        return filePath === this.sourceMap.file || filePath === this.binSourceMap.file;
    }

    /**
     * Returns the appropriate source map service for a given file path.
     *
     * @param filePath - The file path to check, This is an optional parameter.
     * @returns The matching source map service - returns a bin source map if the path matches
     *          the bin source file, otherwise returns the default source map service.
     *
     * @example
     * ```ts
     * // Get the source map service for a specific file path
     * const sourceMap = frameworkProvider.getFrameworkSourceMap(currentFilePath);
     *
     * // Use the default source map service when no path is provided
     * const defaultSourceMap = frameworkProvider.getFrameworkSourceMap();
     * ```
     *
     * @see SourceService
     * @since 1.1.0
     */

    getFrameworkSourceMap(filePath?: string): SourceService {
        if(filePath === this.binSourceMap.file)
            return this.binSourceMap;

        return this.sourceMap;
    }

    /**
     * Determines the root directory based on the provided file path.
     * If the file path is considered part of the framework source files, it returns the framework path;
     * otherwise, it returns the root path.
     *
     * @param filePath - The file path to evaluate. If not provided, defaults to undefined.
     * @returns The root directory path as a string.
     *
     * @throws Error - Throws an error if the evaluation of the root directory fails.
     *
     * @see isFrameworkSourceFile
     * @since 1.0.0
     */

    getRootDirectory(filePath?: string): string {
        return this.isFrameworkSourceFile(filePath)
            ? this.frameworkPaths.framework
            : this.frameworkPaths.root;
    }

    /**
     * Initializes and returns the paths used by the framework.
     *
     * @returns FrameworkPaths containing the root, dist, and framework paths.
     *
     * @remarks
     * This method calculates the current working directory as the root path and determines
     * the distribution and framework paths relative to the module's file URL. It is designed
     * to simplify the management of framework paths based on the runtime environment.
     *
     * @example
     * ```ts
     * const paths = initializePaths();
     * console.log(paths.root); // Outputs the current working directory.
     * console.log(paths.dist); // Outputs the directory of the current module.
     * console.log(paths.framework); // Outputs the framework's base directory.
     * ```
     *
     * @see FrameworkPaths
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
     * Initializes and returns an instance of the `SourceService` responsible for managing source mappings.
     *
     * @param path - Relative path to the source map file from the distribution directory
     * @returns An instance of `SourceService` configured with the loaded source map data.
     *
     * @throws Error - If the source map file is missing, unreadable, or an unexpected error occurs during initialization.
     *                 Includes details about which specific path failed and the underlying error message.
     *
     * @example
     * ```ts
     * // Initialize source map from the main distribution file
     * const mainSourceMap = initializeSourceService('index.js.map');
     *
     * // Initialize source map from the binary executable
     * const binSourceMap = initializeSourceService('bin/index.js.map');
     * ```
     *
     * @see SourceService
     * @since 1.0.0
     */

    private initializeSourceService(path: string): SourceService {
        try {
            const sourceMapPath = join(this.frameworkPaths.dist, path);
            const sourceMapData = readFileSync(sourceMapPath);

            return new SourceService(sourceMapData.toString(), import.meta.url);
        } catch (error) {
            throw new Error(
                `${INITIALIZATION_ERROR}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

/**
 * Singleton instance of the FrameworkProvider used to manage the provider for the framework.
 * This ensures only a single instance of FrameworkProvider exists throughout the application lifecycle.
 *
 * @see FrameworkProvider
 * @since 1.0.0
 */

export const frameworkProvider = FrameworkProvider.getInstance();
