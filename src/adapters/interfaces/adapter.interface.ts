/**
 * Defines a function type that establishes connection with a remote test runner.
 *
 * This type represents the initial setup required to connect to a remote test execution environment.
 * It handles the connection establishment and configuration needed before tests can be dispatched.
 *
 * @remarks
 * Functions implementing this type should:
 * - Initialize connection to remote test runners
 * - Configure authentication if required
 * - Set up communication channels
 * - Ensure the remote environment is ready
 *
 * The connection process is asynchronous and must complete successfully before
 * any test suites can be dispatched to the remote runner.
 *
 * @since 1.0.0
 */

export type ConnectTestRunner = () => Promise<void>;

/**
 * Defines a function type that safely terminates connection with a remote test runner.
 *
 * @remarks
 * Functions implementing this type should:
 * - Close active test execution sessions
 * - Release allocated resources
 * - Terminate communication channels
 * - Clean up any temporary files or data
 * - Ensure graceful shutdown of remote connections
 *
 * The disconnection process is asynchronous to allow proper cleanup
 * and prevent data loss or corrupted test states.
 *
 * @since 1.0.0
 */

export type DisconnectTestRunner = () => Promise<void>;

/**
 * Represents a handler function that processes results from remote test execution.
 *
 * @param data - The serialized test execution results from the remote runner
 *
 * @remarks
 * This handler processes the test execution output including
 * - Test results (pass/fail status)
 * - Assertion details
 * - Error information and stack traces
 * - Test coverage reports
 * - Performance data
 * - Execution logs
 *
 * The data parameter contains all test-related information serialized as a string,
 * which should be parsed and processed according to the implementation needs.
 *
 * @since 1.0.0
 */

export type ResultTestRunner = (data: string) => void;

/**
 * Defines a function type that dispatches test suites to a remote runner for execution.
 *
 * @param suite - The serialized test suite bundle for remote execution
 * @param onResponse - The handler function to process test execution results
 * @returns Promise that resolves after the remote execution completes
 *
 * @remarks
 * This function enables distributed test execution by:
 * - Serializing and sending test suites to remote runners
 * - Managing the remote execution lifecycle
 * - Handling result communication
 * - Coordinating between local and remote environments
 *
 * Key capabilities include:
 * - Cross-environment test execution
 * - Distributed load handling
 * - Parallel test processing
 * - Environment-specific testing
 *
 * The suite parameter should contain all necessary test code and dependencies
 * in a format that can be transmitted and executed remotely.
 *
 * @since 1.0.0
 */

export type DispatchTestSuite = (suite: string, onResponse: ResultTestRunner) => Promise<void>;
