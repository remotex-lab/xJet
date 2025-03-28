/**
 * Defines the essential file paths used by the framework for locating resources and components
 *
 * @interface FrameworkPaths
 * @property root - The current working directory path where the CLI is executed
 * @property dist - The distribution directory containing compiled framework assets
 * @property framework - The root directory containing the dist folder and framework resources
 *
 * @since 1.0.0
 */

export interface FrameworkPaths {
    readonly root: string;
    readonly dist: string;
    readonly framework: string;
}
