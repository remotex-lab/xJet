/**
 * Interface representing the command-line arguments for the build tool.
 *
 * @interface ArgvInterface
 * @property file - The entry file(s) to build.
 * @property config - Path to the jet configuration file (JavaScript or TypeScript).
 */

export interface ArgvInterface {
    file: string,
    config: string,
}
