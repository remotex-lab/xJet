/**
 * Import will remove at compile time
 */

import type { ResultTestRunner } from '@adapters/interfaces/adapter.interface';

/**
 * Establishes connection with a remote test runner and prepares it for test execution.
 *
 * @return A promise that resolves when the connection is successfully established
 *
 * @remarks
 * This function must be called before dispatching any test suites.
 * It:
 * - Initiates connection to the remote test runner
 * - Verifies the connection status
 * - Sets up required communication channels
 * - Ensures the remote environment is ready for test execution
 *
 * @since 1.0.0
 */

export async function connectTestRunner(): Promise<void> {
}

export async function disconnectTestRunner(): Promise<void> {

}

/**
 * Dispatches a test suite to the remote runner for execution.
 *
 * @param suite - The serialized test suite bundle to be executed remotely
 * @param onResponse - Handler function that processes the test execution results
 * @returns A Promise that resolves when the remote execution completes
 *
 * @remarks
 * This function manages the remote test execution process by:
 * - Transmitting the test suite to the remote runner
 * - Managing the execution lifecycle
 * - Routing execution results to the provided handler
 *
 * The suite parameter should contain all necessary test code and dependencies
 * in a serialized format suitable for remote execution.
 * The onResponse handler will be called with the execution results when available.
 *
 * @since 1.0.0
 */

export async function dispatchTestSuite(suite: string, onResponse: ResultTestRunner): Promise<void> {
    console.log(suite, onResponse);
}
