/**
 * Import will remove at compile time
 */

import type { Context } from 'vm';

/**
 * Imports
 */

import { Script, createContext } from 'vm';

/**
 * Executes JavaScript code within a sandboxed environment using Node.As's `vm` module.
 *
 * @param code - The JavaScript code to be executed within the sandbox.
 * @param sandbox - An optional context object to be used as the global scope for the executed code.
 *
 * @returns The result of executing the provided code within the sandboxed environment.
 * @throws {Error} Throws an error if the code cannot be compiled or executed within the context.
 *
 * @example
 * ```ts
 * const result = sandboxExecute('return 2 + 2;', { myGlobal: 10 });
 * console.log(result); // Output: 4
 * ```
 *
 * In this example, the `sandboxExecute` function runs a simple JavaScript expression and returns
 * the result. The `sandbox` parameter is provided with an empty object in this case.
 */

export function sandboxExecute(code: string, sandbox: Context = {}) {
    sandbox.console = console;
    const script = new Script(code);
    const context = createContext(sandbox);

    return script.runInContext(context, { breakOnSigint: true });
}
