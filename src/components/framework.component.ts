/**
 * Import will remove at compile time
 */

import type { FrameworkPaths } from '@components/interfaces/frameworkd-component.interface';

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
 * Represents the primary component for managing framework paths and source services.
 * This class follows a singleton pattern to ensure a single instance throughout the application.
 *
 * @remarks
 * The FrameworkComponent provides functionality for resolving paths specific to the framework,
 * determining if a file is a source file, and managing a source map service for internal usage.
 * This class must be accessed using `getInstance` as it cannot be instantiated directly.
 *
 * @since 1.0.0
 */

export class FrameworkComponent {
    /**
     * Singleton instance of the FrameworkComponent.
     */

    private static instance: FrameworkComponent;

    /**
     * Immutable collection of framework-specific file system paths.
     * Contains paths for root directory, distribution files, and framework location.
     *
     * @see FrameworkPaths
     */

    private readonly frameworkPaths: FrameworkPaths;

    /**
     * Lazily initialized service for handling source map operations.
     * This service is created only when needed and cached for later uses.
     *
     * @see SourceService
     */

    private sourceService?: SourceService;

    /**
     * Creates a new instance of FrameworkComponent and initializes framework paths.
     *
     * @remarks
     * This constructor is private to enforce the singleton pattern.
     * It initializes the essential framework paths required for operation.
     * To get an instance of FrameworkComponent, use the `getInstance()` static method instead.
     *
     * @since 1.0.0
     */


    private constructor() {
        this.frameworkPaths = this.initializePaths();
    }

    /**
     * Retrieves the singleton instance of FrameworkComponent, creating it if it doesn't exist.
     *
     * @returns FrameworkComponent - The singleton instance of FrameworkComponent
     *
     * @remarks
     * This method implements the lazy initialization pattern for the singleton instance.
     * The instance is created only on the first call and reused for all further calls.
     * Thread safety is not guaranteed in concurrent environments.
     *
     * @example
     * ```typescript
     * const frameworkInstance1 = FrameworkComponent.getInstance();
     * const frameworkInstance2 = FrameworkComponent.getInstance();
     *
     * console.log(frameworkInstance1 === frameworkInstance2); // true
     * ```
     *
     * @since 1.0.0
     */

    static getInstance(): FrameworkComponent {
        if (!FrameworkComponent.instance) {
            FrameworkComponent.instance = new FrameworkComponent();
        }

        return FrameworkComponent.instance;
    }

    /**
     * Retrieves the framework paths configuration.
     *
     * @returns FrameworkPaths - An object containing essential framework paths
     *
     * @see FrameworkPaths
     *
     * @since 1.0.0
     */


    get paths(): FrameworkPaths {
        return this.frameworkPaths;
    }

    /**
     * Provides access to the source map service, initializing it if necessary.
     *
     * @returns SourceService - The initialized source map service instance
     *
     * @remarks
     * Implements lazy initialization pattern. The service is created only on first access
     * and cached for further calls.
     *
     * @throws Error - If source map initialization fails
     *
     * @see SourceService
     *
     * @since 1.0.0
     */

    get sourceMap(): SourceService {
        if (!this.sourceService) {
            this.sourceService = this.initializeSourceService();
        }

        return this.sourceService;
    }

    /**
     * Determines whether a given file path corresponds to a framework source file.
     *
     * @param filePath - The path to check
     * @returns True if the path matches a framework source file, false otherwise
     *
     * @since 1.0.0
     */


    isFrameworkSourceFile(filePath?: string): boolean {
        return filePath === this.sourceMap.file;
    }

    /**
     * Determines the appropriate root directory based on the file path context.
     *
     * @param filePath - The path to evaluate
     * @returns The framework root directory if the path is a framework file,
     * otherwise returns the project root directory
     *
     * @since 1.0.0
     */

    getRootDirectory(filePath?: string): string {
        return this.isFrameworkSourceFile(filePath)
            ? this.frameworkPaths.framework
            : this.frameworkPaths.root;
    }

    /**
     * Initializes the framework paths configuration.
     *
     * @returns FrameworkPaths - An object containing the configured framework paths
     *
     * @remarks
     * Uses the current module's URL to determine relative paths and establishes
     * the directory structure for the framework.
     *
     * @see FrameworkPaths
     *
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
     * Creates and configures a new source map service instance.
     *
     * @returns SourceService - The configured source map service
     *
     * @remarks
     * Reads the source map file from the distribution directory and initialize
     * the service with the current module's URL.
     *
     * @throws Error - If the source map file cannot be read or parsed
     *
     * @see SourceService
     *
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
