/**
 * Import will remove at compile time
 */

import type {
    ConnectTestRunner,
    DisconnectTestRunner,
    DispatchTestSuite
} from '@adapters/interfaces/adapter.interface';

/**
 * A utility type that recursively makes all properties of a given type `T` optional.
 * If a property of `T` is itself an object, this type will also apply the `PartialDeep` transformation to the nested object.
 *
 * @template T - The type for which all properties, including nested ones, will be made optional.
 *
 * @remarks
 * This type is particularly useful when working with deeply nested objects where partial updates or optional inputs are necessary.
 * It ensures that deeply nested properties can be omitted while still conforming to the expected type structure.
 *
 * @since 1.0.0
 */

export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Defines the configuration interface for setting up and managing test execution.
 * It provides various options to control the test environment, execution flow,
 * and reporting mechanisms.
 *
 * @remarks
 * This interface is designed to standardize configuration options across
 * different testing environments and frameworks.
 *
 * @since 1.0.0
 */

export interface ConfigurationInterface {
    /**
     * @property seed - Random seed number used for test case ordering and randomization.
     */

    seed: number;

    /**
     * @property bail - When true, stops test execution immediately upon encountering the first failure.
     */

    bail: boolean;

    /**
     * @property files - List of test files or patterns to be included in the test run.
     */

    files: Array<string>;

    /**
     * @property suite - Name identifier for the test suite to be executed.
     */

    suite: string;

    /**
     * @property watch - Enables watch mode for continuous test execution when true.
     */

    watch: boolean;

    /**
     * @property silent - Controls the suppression of test output and logging.
     */

    silent: boolean;

    /**
     * @property filter - Pattern string used to filter test cases or description by name.
     */

    filter: string;

    /**
     * @property update - Controls snapshot update behavior in tests.
     */

    update: boolean;

    /**
     * @property timeout - Maximum duration (in milliseconds) allowed for each test case.
     */

    timeout: number;

    /**
     * @property verbose - Enables detailed output logging during test execution.
     */

    verbose: boolean;

    /**
     * @property exclude - List of patterns for files to be excluded from testing.
     */

    exclude: Array<string>;

    /**
     * @property reporter - Specifies the reporter file path of a test result reporter to use.
     */

    reporter: string;

    /**
     * @property connectTestRunner - Configuration settings for initializing the test adapter
     * that allow exec the test remotely.
     */

    connectTestRunner: ConnectTestRunner;

    /**
     * @property disconnectTestRunner - Represents a mechanism to disconnect a test runner safely and cleanly.
     */

    disconnectTestRunner: DisconnectTestRunner;

    /**
     * @property dispatchTestSuite - Configuration for handling adapter-specific requests
     * that get the suit as string to send it to run remotely.
     */

    dispatchTestSuite: DispatchTestSuite;
}

/**
 * Represents the structure and metadata of a specific module.
 * This interface is used to define the expected exports of a module.
 *
 * @remarks
 * Modules implementing this interface are expected to specify their exported members,
 * where each key represents an export, and the associated value is the corresponding export's content.
 * A module can optionally define a default export adhering to the `ConfigurationInterface`.
 *
 * @since 1.0.0
 */

export interface ModuleInterface {

    /**
     * An object representing the exports of the module.
     * The keys are strings representing export names, and the values can be of any type.
     *
     * @property default - An optional default export of type `ConfigurationInterface`.
     */

    exports: {
        [key: string]: unknown;
        default?: ConfigurationInterface;
    };
}

/**
 * Represents a configuration object specific to xJet, allowing for partial and deeply nested properties to be defined.
 *
 * This type is a partial deep version of the `ConfigurationInterface`, enabling flexible configuration by only requiring
 * the properties that need to be customized, while other properties can take their default values.
 *
 * @remarks
 * The `xJetConfig` type is useful when working with extensive configuration objects where only a subset of properties
 * needs to be overridden. It enables better maintainability and cleaner code by avoiding the need to specify the entire
 * structure of the `ConfigurationInterface`.
 *
 * @see ConfigurationInterface
 *
 * @since 1.0.0
 */

export type xJetConfig = PartialDeep<ConfigurationInterface>;
