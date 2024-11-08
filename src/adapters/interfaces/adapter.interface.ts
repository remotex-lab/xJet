/**
 * Represents an asynchronous function that initializes the adapter.
 *
 * This function is used to set up any necessary configuration or connections
 * for the adapter before processing requests or handling responses.
 *
 * @returns A promise that resolves once the initialization process completes.
 */

export type AdapterInit = () => Promise<void>;

/**
 * A callback function that processes the response data from the server or remote execution.
 *
 * This function is invoked whenever data is received from the adapter, typically
 * during the execution of a test suite or other operations.
 *
 * @param data - The response data as a string, representing the output or result from the server.
 */

export type AdapterResponseType = (data: string) => void;

/**
 * Sends a request (such as a test suite) to the server or remote system for execution
 * and handles the response through a callback.
 *
 * This function is responsible for transmitting the suite to be executed and
 * invokes the provided `onResponse` callback with the data received from the server.
 *
 * @param suite - The name or identifier of the suite to be executed on the remote system.
 * @param onResponse - A callback function to handle the response data from the server.
 *
 * @returns A promise that resolves once the suite has been successfully sent
 * and the response handling is complete.
 */

export type AdapterRequestType = (suite: string, onResponse: AdapterResponseType) => Promise<void>;
