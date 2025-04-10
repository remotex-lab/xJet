/**
 * Defines an interface for managing test suite execution and communication.
 * TestRunnerInterface handles dispatching test suites, establishing connections for data transfer,
 * and managing disconnection from test environments.
 *
 * @since 1.0.0
 */

export interface TestRunnerInterface {
    /**
     * A unique identifier represented as a string.
     * @since 1.0.0
     */

    id?: string;

    /**
     * Name identifier for the test runner instance.
     * @since 1.0.0
     */

    name: string;

    /**
     * Defines the amount of time, in milliseconds, to wait to response before a connection mark as times out.
     * @since 1.0.0
     */

    connectionTimeout: number;

    /**
     * Specifies the time in milliseconds to wait before a dispatch operation times out.
     * @since 1.0.0
     */

    dispatchTimeout: number;

    /**
     * Sends a test suite to be executed by the runner.
     *
     * @param suite - Binary buffer containing the serialized test suite data.
     * @param suiteId - A unique identifier that distinguishes this suite within the system.
     * @returns Promise that resolves when the dispatch operation completes.
     *
     * @throws TimeoutError - When the dispatch operation exceeds the configured timeout.
     *
     * @since 1.0.0
     */

    dispatch(suite: Buffer, suiteId: string): Promise<void>;

    /**
     * Establishes a connection for receiving data from the test runner.
     *
     * @param resolve - Callback function that processes received data buffers.
     * @param runnerId - A unique identifier that distinguishes this runner within the system.
     * @returns Promise that resolves when the connection is successfully established.
     *
     * @remarks
     * The resolve callback will be invoked each time data is received from the test runner.
     *
     * @since 1.0.0
     */

    connection(resolve: (data: Buffer) => void, runnerId: string): Promise<void>;

    /**
     * Terminates the connection to the test runner.
     *
     * @returns Promise that resolves when disconnection is complete.
     *
     * @since 1.0.0
     */

    disconnect(): Promise<void>;
}

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
     * @property bail - When true, stops test execution immediately upon encountering the first failure.
     * @since 1.0.0
     */

    bail: boolean;

    /**
     * @property files - List of test files or patterns to be included in the test run.
     * @since 1.0.0
     */

    files: Array<string>;

    /**
     * @property suites - path identifier for the suite files to be executed.
     * @since 1.0.0
     */

    suites: Array<string>;

    /**
     * @property watch - Enables watch mode for rerun tests on file changes.
     * @since 1.0.0
     */

    watch: boolean;

    /**
     * @property silent - Controls the suppression of test output and logging.
     * @since 1.0.0
     */

    silent: boolean;

    /**
     * @property filter - Pattern string used to filter test cases or description by name.
     * @since 1.0.0
     */

    filter: string;

    /**
     * @property update - Controls snapshot update behavior in tests.
     * @since 1.0.0
     */

    update: boolean;

    /**
     * @property timeout - Maximum duration (in milliseconds) allowed for each test case.
     * @since 1.0.0
     */

    timeout: number;

    /**
     * @property verbose - Enables detailed output logging during test execution.
     * @since 1.0.0
     */

    verbose: boolean;

    /**
     * @property exclude - List of patterns for files to be excluded from testing.
     * @since 1.0.0
     */

    exclude: Array<string>;

    /**
     * @property reporter - Specifies the reporter file path of a test result reporter to use.
     * @since 1.0.0
     */

    reporter: string;

    /**
     * Specifies the number of suites to run concurrently in parallel execution mode.
     * Higher values may improve test execution speed on multicore systems but could increase resource usage.
     * Set to 1 to disable parallel suite execution.
     *
     * @since 1.0.0
     */

    parallel: number;

    /**
     * @property randomize - Randomize test execution order
     * @since 1.0.0
     */

    randomize: boolean;

    /**
     * @property build - Configuration options for the build process
     * @since 1.0.0
     */

    build: {
        /**
         * @property target - Specifies the target environment(s) for the build output.
         * Can be a single string or an array of target environments.
         *
         * @since 1.0.0
         */

        target?: string | Array<string>,

        /**
         * @property external - List of package names that should be treated as external and not bundled with the output.
         * These packages will be expected to be available in the runtime environment.
         *
         * @since 1.0.0
         */

        external?: Array<string>,

        /**
         * @property platform - Defines the platform compatibility for the build.
         * - 'browser': Optimizes the build for web browsers
         * - 'node': Optimizes the build for Node.js environment
         * - 'neutral': Creates a platform-agnostic build
         *
         * @since 1.0.0
         */

        platform?: 'browser' | 'node' | 'neutral',

        /**
         * @property packages - Determines how to handle dependencies in the build.
         * - 'bundle': Includes all dependencies in the output bundle
         * - 'external': Treats dependencies as external, requiring them to be available
         *   in the runtime environment
         *
         *   @since 1.0.0
         */

        packages?: 'bundle' | 'external',
    }

    /**
     * Optional array of test runner implementations that will be used to execute the tests.
     * Multiple test runners can be specified to support different testing environments or frameworks.
     *
     * @see TestRunnerInterface
     *
     * @since 1.0.0
     */

    testRunners?: Array<TestRunnerInterface>;
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

export type xJetConfig = Partial<ConfigurationInterface>;
