/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { ConfigurationInterface, ModuleInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */
import { createRequire } from 'module';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { isPromise } from '@components/promise.component';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';

/**
 * Wraps a function with additional error handling and ties it to a source map for enhanced debugging or tracing.
 *
 * @template T The type of the function to be wrapped.
 *
 * @param fn - The function to be wrapped.
 * This function must adhere to the `FunctionType` type.
 * @param sourceMap - An instance of `SourceService` used for handling source map information.
 * @returns The wrapped function with source map error handling applied.
 *          If the original function returns a Promise, the wrapped function will handle promise rejection.
 *
 * @throws VMRuntimeError - If the original function throws an error,
 * or if the result of the function call (if it returns a Promise) is rejected.
 *
 * @remarks This function is particularly useful
 * when debugging or handling exceptions in an environment where source maps are needed for error context.
 *
 * @see SourceService
 *
 * @since 1.0.0
 */

export function wrapFunctionWithSourceMap<T extends FunctionType>(fn: T, sourceMap: SourceService): T {
    return ((...args: Parameters<T>): Promise<ReturnType<T>> | ReturnType<T> => {
        try {
            const result = fn(...args) as ReturnType<T>;

            // Check if the result is a Promise
            if (isPromise(result)) {
                return result.catch((error: unknown) => {
                    throw new VMRuntimeError(<Error> error, sourceMap);
                });
            }

            return Promise.resolve(result);
        } catch (error) {
            throw new VMRuntimeError(<Error> error, sourceMap);
        }
    }) as T;
}

/**
 * Recursively wraps all functions within an object with a source map utility.
 *
 * @template T The type of the object being processed.
 *
 * @param obj - The object whose functions need to be wrapped.
 * @param sourceMap - An instance of the SourceService used to wrap the functions.
 * @param visited - A WeakSet to keep track of visited objects and avoid circular references,
 * Defaults to an empty WeakSet.
 * @returns The same object with its functions wrapped by the source map utility.

 * @remarks This method recursively visits all properties of the provided object.
 * Any encountered functions will be wrapped with a source map for additional metadata utility.
 * Care is taken to prevent infinite recursion due to circular references.
 *
 * @since 1.0.0
 */

export function wrapAllFunctions<T extends object>(obj: T, sourceMap: SourceService, visited: WeakSet<object> = new WeakSet()): T {
    // Guard against circular references
    if (visited.has(obj)) {
        return obj;
    }

    // Mark current object as visited
    visited.add(obj);

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key as keyof T];

            if (typeof value === 'function') {
                // Safely cast and wrap the function
                (obj as Record<string, unknown>)[key] = wrapFunctionWithSourceMap(value as (...args: unknown[]) => unknown, sourceMap);
            } else if (typeof value === 'object' && value !== null) {
                // Recursively wrap functions in nested objects
                wrapAllFunctions(value, sourceMap, visited);
            }
        }
    }

    return obj;
}

/**
 * Parses and processes a configuration file, transpiling and executing its content
 * in a sandboxed environment to extract the exported configuration object.
 *
 * @param file - The file path to the configuration file that will be parsed and executed.
 * @returns A Promise that resolves to a configuration object implementing the `ConfigurationInterface`.
 *
 * @throws VMRuntimeError - Throws an error if the execution of the transpiled code fails in the sandbox.
 *
 * @remarks
 * This method is designed to securely execute the configuration file in an isolated
 * environment and retrieve its exported default module.
 * The file is transpiled prior to execution to ensure compatibility with different module environments.
 *
 * @since 1.0.0
 */

export async function parseConfigurationFile(file: string): Promise<ConfigurationInterface> {
    const { code, sourceMap } = await transpileFile(file, {
        banner: { js: '(function(module, exports) {' },
        footer: { js: '})(module, module.exports);' }
    });

    const sourceMapObject = JSON.parse(sourceMap);
    if (sourceMapObject.mappings.length < 1)
        return <ConfigurationInterface> {};

    const module: ModuleInterface = { exports: {} };
    const require = createRequire(import.meta.url);
    const source = new SourceService(sourceMapObject);

    try {
        await sandboxExecute(code, {
            require,
            module
        });
    } catch (error: unknown) {
        throw new VMRuntimeError(<Error> error, source);
    }

    return wrapAllFunctions(<ConfigurationInterface> module.exports.default, source);
}
