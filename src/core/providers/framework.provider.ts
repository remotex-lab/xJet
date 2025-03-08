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
     * Lazily initialized service for handling source map operations.
     * This service is created only when needed and cached for later uses.
     *
     * @see SourceService
     * @since 1.0.0
     */

    private sourceService?: SourceService;

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
     * Retrieves the current source map service, initializing it if necessary.
     *
     * @returns The initialized SourceService instance
     *
     * @see SourceService
     * @since 1.0.0
     */

    get sourceMap(): SourceService {
        if (!this.sourceService) {
            this.sourceService = this.initializeSourceService();
        }

        return this.sourceService;
    }

    /**
     * Determines if the given file path corresponds to the framework's source file.
     *
     * @param filePath - The file path to check. This is an optional parameter.
     * @returns `true` if the provided file path is the same as the framework's source file, otherwise `false`.
     *
     * @since 1.0.0
     */

    isFrameworkSourceFile(filePath?: string): boolean {
        return filePath === this.sourceMap.file;
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
        const distPath = dirname(fileURLToPath(import.meta.url));

        return {
            root: cwd(),
            dist: distPath,
            framework: dirname(dirname(distPath))
        };
    }

    /**
     * Initializes and returns an instance of the `SourceService` responsible for managing source mappings.
     *
     * @returns An instance of `SourceService` configured with the loaded source map data.
     *
     * @throws Error - If the source map file is missing, unreadable, or an unexpected error occurs during initialization.
     *
     * @see SourceService
     * @since 1.0.0
     */

    private initializeSourceService(): SourceService {
        try {
            const sourceMapPath = join(this.frameworkPaths.dist, SOURCE_MAP_FILENAME);
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
