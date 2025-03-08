/**
 * Represents the structure defining key paths for a framework, including base,
 * distribution, and framework-specific directories.
 *
 * @since 1.0.0
 */

export interface FrameworkPaths {
    /**
     * Represents the root path or base directory for a given operation or context.
     *
     * @since 1.0.0
     */

    readonly root: string;

    /**
     * Represents the dist directory of the current module.
     *
     * @since 1.0.0
     */

    readonly dist: string;

    /**
     * Represents the root directory of the current module.
     *
     * @since 1.0.0
     */

    readonly framework: string;
}
