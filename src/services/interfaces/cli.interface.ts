/**
 * Interface representing the available command-line options for a CLI application.
 *
 * @remarks
 * This interface defines the structure of the possible options that can be
 * passed to the CLI application to customize its behavior and execution.
 *
 * @since 1.0.0
 */

export interface CliOptionsInterface {
    seed?: number;
    bail?: boolean;
    suite?: string;
    watch?: boolean;
    files?: string[];
    silent?: boolean;
    update?: boolean;
    config?: string;
    filter?: string;
    timeout?: number;
    verbose?: boolean;
    reporter?: string;
    coverage?: boolean;
}
