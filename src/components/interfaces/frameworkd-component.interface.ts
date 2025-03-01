/**
 * Represents the file system paths relevant to the framework and its running environment.
 *
 * @remarks
 * This interface defines three key paths related to the application and framework,
 * enabling consistent access to relevant directories within the project structure.
 *
 * @since 1.0.0
 */

export interface FrameworkPaths {
    /**
     * The root directory or base path used in the application.
     */

    readonly root: string;

    /**
     * The path to framework's distribution directory
     */

    readonly dist: string;

    /**
     * The root path of the framework
     */

    readonly framework: string;
}
