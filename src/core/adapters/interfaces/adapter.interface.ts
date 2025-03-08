/**
 * Represents a handler function that processes results from remote test execution.
 *
 * @param data - The serialized test execution results from the remote runner
 * @returns void
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
 * @example
 * ```ts
 * const resultHandler: ResultTestRunner = (data) => {
 *   const results = JSON.parse(data);
 *   console.log(`Tests completed: ${results.passed} passed, ${results.failed} failed`);
 * };
 * ```
 *
 * @since 1.0.0
 */

export type ResultTestRunner = (data: string) => void;

/**
 * Defines a function type that establishes connection with a remote test runner.
 *
 * @param onResponse - The callback function to handle results from remote test execution
 * @returns Promise that resolves when connection is established
 *
 * @remarks
 * Functions implementing this type should:
 * - Initialize connection to remote test runners
 * - Configure authentication if required
 * - Set up communication channels
 * - Ensure the remote environment is ready
 *
 * @example
 * ```ts
 * const connectRunner: ConnectTestRunner = async (resultHandler) => {
 *   const connection = await RemoteTestEnvironment.connect({
 *     url: 'https://test-runner.example.com',
 *     credentials: getAuthToken()
 *   });
 *
 *   connection.onResult(resultHandler);
 *   return connection;
 * };
 * ```
 *
 * @throws ConnectionError - When unable to establish connection to remote test environment
 *
 * @see ResultTestRunner
 * @since 1.0.0
 */

export type ConnectTestRunner = (onResponse: ResultTestRunner) => Promise<void>;

/**
 * Defines a function type that safely terminates connection with a remote test runner.
 *
 * @returns Promise that resolves when disconnection is complete
 *
 * @remarks
 * Functions implementing this type should:
 * - Close active test execution sessions
 * - Release allocated resources
 * - Terminate communication channels
 * - Clean up any temporary files or data
 * - Ensure graceful shutdown of remote connections
 *
 * @example
 * ```ts
 * const disconnectRunner: DisconnectTestRunner = async () => {
 *   await connection.finalizeActiveSessions();
 *   await connection.close();
 *   cleanupTemporaryResources();
 * };
 * ```
 *
 * @throws DisconnectionError - When errors occur during connection termination
 *
 * @since 1.0.0
 */

export type DisconnectTestRunner = () => Promise<void>;

/**
 * Defines a function type that dispatches test suites to a remote runner for execution.
 *
 * @param suite - The serialized test suite bundle for remote execution
 * @returns Promise that resolves after the remote execution completes
 *
 * @remarks
 * This function enables distributed test execution by:
 * - Serializing and sending test suites to remote runners
 * - Managing the remote execution lifecycle
 * - Handling result communication
 * - Coordinating between local and remote environments
 *
 * @example
 * ```ts
 * const dispatchTests: DispatchTestSuite = async (suiteBundle) => {
 *   try {
 *     await remoteRunner.send(suiteBundle);
 *     console.log('Test suite dispatched successfully');
 *   } catch (error) {
 *     console.error('Failed to dispatch test suite:', error);
 *     throw error;
 *   }
 * };
 * ```
 *
 * @throws DispatchError - When test suite cannot be sent or executed remotely
 *
 * @see ConnectTestRunner
 * @see ResultTestRunner
 * @since 1.0.0
 */

export type DispatchTestSuite = (suite: string) => Promise<void>;
