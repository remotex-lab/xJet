/**
 * Import will remove at compile time
 */

import type { Context } from 'vm';

/**
 * Imports
 */

import { Script, createContext } from 'vm';

/**
 * Executes a given JavaScript code in a sandboxed context.
 * This function creates a new `Script` object from the provided code and runs it within a sandboxed environment.
 * The sandbox can be customized by passing a context object,
 * allowing the code execution to be isolated from the global environment.
 * The execution is controlled using Node.js `vm` module,
 * ensuring that the code runs within a specified context and can be safely interrupted.
 *
 * ## Input:
 *  - **code**: A string containing the JavaScript code to be executed.
 *      - This should be a valid JavaScript code snippet to be run within the sandbox.
 *  - **sandbox** (optional): An object that defines the context in which the code will be executed.
 *      - Default: `{}` (an empty object).
 *      - This context object can contain variables, functions,
 *      or other properties that the code will have access to during execution.
 *
 * ## Output:
 * A value returned by the code executed in the sandboxed environment.
 * The return value depends on the code provided, which may include the result of a function call or other expressions.
 *
 * @example
 * ```ts
 * const result = sandboxExecute('return x + 1;', { x: 10 });
 * console.log(result); // 11
 * ```
 *
 * ## Error Handling:
 * - If the provided code is invalid or there is an error during execution, the function will throw an error.
 * - If the sandbox context is not provided, the code will execute in an empty sandbox by default.
 *
 * @example
 * ```ts
 * try {
 *   const result = sandboxExecute('throw new Error("Test Error")');
 * } catch (error) {
 *   console.error('Error during sandbox execution:', error);
 * }
 * ```
 *
 * @param code - The JavaScript code to execute in the sandboxed environment.
 * @param sandbox - Optional context object to provide variables and functions for the code execution.
 * @returns The result of the code executed in the sandbox context.
 *
 * @throws Error - If the code execution fails or there is an issue with the sandbox context.
 * @remarks
 * This function uses Node.js `vm` module to provide a secure and isolated environment for executing code.
 * @see https://nodejs.org/api/vm.html for more details on the `vm` module.
 * @see Context
 * @since v1.0.0
 */

export function sandboxExecute(code: string, sandbox: Context = {}) {
    const script = new Script(code);
    const context = createContext(sandbox);

    return script.runInContext(context, { breakOnSigint: true, filename: '../src/index.ts' });
}
