/**
 * Import will remove at compile time
 */

import type { AdapterResponseType } from '@adapters/interfaces/adapter.interface';

/**
 * Initializes the adapter by setting up necessary configurations or connections.
 *
 * This function is responsible for preparing the adapter to communicate with the
 * remote server or system, which may include setting up connections, loading
 * necessary resources, or performing other initialization tasks.
 *
 * @returns A promise that resolves when the initialization is complete.
 */

export async function adapterInit(): Promise<void> {
}

/**
 * Sends a test suite or request to a remote server and handles the server's response.
 *
 * This function sends the specified `suite` to be executed on the remote server and
 * processes the server's response via the `onResponse` callback. The response is
 * typically received as a string representing the test results or output.
 *
 * @param suite - The name or identifier of the suite to be executed on the remote server.
 * @param onResponse - A callback function to handle the response data received from the server.
 *
 * @returns A promise that resolves when the suite has been sent and the response has been processed.
 */

export async function adapterRequest(suite: string, onResponse: AdapterResponseType): Promise<void> {

}
