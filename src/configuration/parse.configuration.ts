/**
 * Import will remove at compile time
 */

import type { BuildOptions } from 'esbuild';
import type { FunctionType } from '@interfaces/function.interface';
import type { ErrorType } from '@components/interfaces/stack-component.interface';
import type { ConfigurationInterface, ModuleInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import EventEmitter from 'events';
import { createRequire } from 'module';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@services/vm.service';
import { isPromise } from '@components/promise.component';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Patches the Node.js EventEmitter's emit method with enhanced error handling capabilities.
 * This function intercepts errors thrown during event emission and wraps them with VMRuntimeError
 * to provide better stack traces and error context.
 *
 * @param sourceMap - The SourceService instance used to provide source mapping information for errors
 * @returns void
 *
 * @throws VMRuntimeError - When an error occurs in an event handler and is determined not to be a framework error
 * @throws Error - When an error occurs in an event handler and is determined to be a framework error
 *
 * @remarks
 * This function modifies EventEmitter's prototype directly, affecting all instances in the application.
 * It preserves the original behavior of emit but adds a try-catch block that processes any errors
 * that occur during event handling.
 *
 * @example
 * ```ts
 * import { SourceService } from '@remotex-labs/xmap';
 *
 * const sourceMap = new SourceService(mapData);
 * patchEventEmitterErrors(sourceMap);
 *
 * // Now all EventEmitter errors will be processed through VMRuntimeError
 * ```
 *
 * @see VMRuntimeError
 * @see SourceService
 * @since 1.0.0
 */

export function patchEventEmitterErrors(sourceMap: SourceService) {
    const originalEmit = EventEmitter.prototype.emit;
    EventEmitter.prototype.emit = function(type: string, ...args: Array<unknown>) {
        try {
            return originalEmit.apply(this, [ type, ...args ]);
        } catch (error) {
            throw new VMRuntimeError(<ErrorType> error, sourceMap, false);
        }
    };
}

/**
 * Wraps a function with additional error handling and ties it to a source map for enhanced debugging or tracing.
 *
 * @template T - The type of the function to be wrapped
 *
 * @param fn - The function to be wrapped
 * @param sourceMap - An instance of SourceService used for handling source map information
 * @returns The wrapped function with source map error handling applied
 *
 * @throws VMRuntimeError - If the original function throws an error or if the promise is rejected
 *
 * @remarks
 * This function is particularly useful when debugging or handling exceptions in an environment
 * where source maps are needed for error context. If the original function returns a Promise,
 * the wrapped function will handle promise rejection.
 *
 * @example
 * ```ts
 * const sourceMap = new SourceService(mapData);
 * const wrappedFn = wrapFunctionWithSourceMap(originalFunction, sourceMap);
 *
 * try {
 *   const result = await wrappedFn(arg1, arg2);
 *   console.log('Function executed successfully');
 * } catch (error) {
 *   // Error will be a VMRuntimeError with source map context
 *   console.error('Error with source context:', error);
 * }
 * ```
 *
 * @see SourceService
 * @since 1.0.0
 */

export function wrapFunctionWithSourceMap<T extends FunctionType>(fn: T, sourceMap: SourceService): T {
    const wrappedFunction = (...args: Parameters<T>): Promise<ReturnType<T>> | ReturnType<T> => {
        try {
            const result = fn(...args) as ReturnType<T>;

            if (isPromise(result)) {
                return result.catch((error: unknown) => {
                    throw new VMRuntimeError(error as VMRuntimeError, sourceMap);
                });
            }

            return result;
        } catch (error) {
            throw new VMRuntimeError(error as VMRuntimeError, sourceMap);
        }
    };

    return wrappedFunction as T;
}

/**
 * Recursively wraps all functions within an object with a source map utility.
 *
 * @template T - The type of the object being processed
 *
 * @param obj - The object whose functions need to be wrapped
 * @param sourceMap - An instance of the SourceService used to wrap the functions
 * @param visited - A WeakSet to keep track of visited objects and avoid circular references
 * @returns The same object with its functions wrapped by the source map utility
 *
 * @remarks
 * This method recursively visits all properties of the provided object.
 * Any encountered functions will be wrapped with a source map for additional metadata utility.
 * Care is taken to prevent infinite recursion due to circular references.
 *
 * @example
 * ```ts
 * const sourceMap = new SourceService(mapData);
 * const config = {
 *   runTests: function() { \/* test execution logic *\/ },
*   utils: {
*     formatResults: function() { \/* formatting logic *\/ }
*   }
* };
*
* // Wrap all functions in the config object with source map error handling
* const wrappedConfig = wrapAllFunctions(config, sourceMap);
* ```
 *
 * @see wrapFunctionWithSourceMap
 * @see SourceService
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
                // Type-safe wrapping of functions
                const typedKey = key as keyof T;
                obj[typedKey] = wrapFunctionWithSourceMap(value as FunctionType, sourceMap) as T[keyof T];
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
 * @param file - The file path to the configuration file that will be parsed and executed
 * @returns Promise that resolves to a configuration object implementing the ConfigurationInterface
 *
 * @throws VMRuntimeError - When the execution of the transpiled code fails in the sandbox
 *
 * @remarks
 * This method is designed to securely execute the configuration file in an isolated
 * environment and retrieve its exported default module.
 * The file is transpiled prior to execution to ensure compatibility with different module environments.
 *
 * @example
 * ```ts
 * async function loadConfiguration() {
 *   try {
 *     const config = await parseConfigurationFile('./path/to/config.ts');
 *     console.log('Configuration loaded successfully:', config);
 *     return config;
 *   } catch (error) {
 *     console.error('Failed to parse configuration:', error);
 *     return defaultConfiguration;
 *   }
 * }
 * ```
 *
 * @see ConfigurationInterface
 * @see transpileFile
 * @see sandboxExecute
 * @since 1.0.0
 */

export async function parseConfigurationFile(file: string): Promise<ConfigurationInterface> {
    const transpileOptions: BuildOptions = {
        minify: false,
        platform: 'node',
        logLevel: 'silent',
        packages: 'external',
        minifySyntax: true,
        preserveSymlinks: true,
        minifyWhitespace: true,
        minifyIdentifiers: false
    };

    const { code, sourceMap } = await transpileFile(file, transpileOptions);
    const sourceMapObject = JSON.parse(sourceMap);

    if (sourceMapObject.mappings.length < 1) {
        return {} as ConfigurationInterface;
    }

    const module: ModuleInterface = { exports: {} };
    const require = createRequire(import.meta.url);
    const source = new SourceService(sourceMapObject);
    FrameworkProvider.getInstance().configuration = source;
    patchEventEmitterErrors(source);

    try {
        await sandboxExecute(code, {
            Error,
            module,
            Buffer,
            RegExp,
            require,
            console,
            setTimeout,
            setInterval
        }, { filename: file });
    } catch (error: unknown) {
        throw new VMRuntimeError(error as ErrorType, source);
    }

    return wrapAllFunctions(module.exports.default as ConfigurationInterface, source);
}
