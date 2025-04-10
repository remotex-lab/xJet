/**
 * Represents the location information for an ESBuild error
 *
 * @example
 * ```ts
 * const errorLocation: esBuildLocationInterface = {
 *   file: 'src/index.ts',
 *   line: 10,
 *   column: 15,
 *   length: 4,
 *   lineText: 'import { readFile } from "fs";',
 *   namespace: '',
 *   suggestion: ''
 * };
 * ```
 *
 * @since 1.0.0
 */

interface esBuildLocationInterface {
    file: string;
    line: number;
    length: number;
    column: number;
    lineText: string;
    namespace: string;
    suggestion: string;
}

/**
 * Represents a detailed error object returned by esbuild during compilation.
 *
 * This interface defines the structure of individual error information provided
 * by esbuild when compilation fails, including location data and optional
 * contextual information.
 *
 * @interface esBuildAggregateErrorInterface
 *
 * @property id - Unique identifier for the error.
 * @property text - The main error message text.
 * @property notes - Additional contextual notes about the error,
 *           which may include suggestions for fixing the issue.
 * @property detail - Optional detailed description of the error.
 * @property location - Information about where the error occurred,
 *           including file, line, and column numbers.
 * @property pluginName - Name of the esbuild plugin that generated the error,
 *           or core esbuild name if from the main compiler.
 *
 * @example
 * ```ts
 * const error: esBuildAggregateErrorInterface = {
 *   id: 'import-not-found',
 *   text: 'Could not resolve import "missing-module"',
 *   notes: [{ text: 'You may need to install this dependency.' }],
 *   location: {
 *     file: 'src/index.ts',
 *     line: 5,
 *     column: 8,
 *     length: 15,
 *     lineText: 'import { something } from "missing-module";'
 *   },
 *   pluginName: 'esbuild'
 * };
 * ```
 *
 * @see esBuildLocationInterface
 * @see esBuildErrorInterfaces
 * @since 1.0.0
 */

export interface esBuildAggregateErrorInterface {
    id: string;
    text: string;
    notes: Array<{
        text: string;
    }>;
    detail?: string;
    location: esBuildLocationInterface;
    pluginName: string;
}

/**
 * Extends the standard JavaScript Error interface to include structured error information
 * returned by the esbuild compiler.
 *
 * This interface is used to properly type and handle compilation aggregateErrors from esbuild,
 * allowing access to an array of detailed error objects.
 *
 * @interface esBuildErrorInterfaces
 * @extends Error
 *
 * @property aggregateErrors - An optional array of detailed
 *           error objects containing specific information about each compilation error.
 *
 * @example
 * ```ts
 * try {
 *   // Some esbuild operation
 *   await esbuild.build(options);
 * } catch (err) {
 *   if (err && typeof err === 'object' && 'aggregateErrors' in err) {
 *     const buildError = err as esBuildErrorInterfaces;
 *     if (buildError.aggregateErrors) {
 *       buildError.aggregateErrors.forEach(error => {
 *         console.error(
 *           `Build error: ${error.text} in ${error.location.file}:${error.location.line}`
 *         );
 *         error.notes.forEach(note => console.log(`Note: ${note.text}`));
 *       });
 *     }
 *   }
 * }
 * ```
 *
 * @see esBuildAggregateErrorInterface
 * @since 1.0.0
 */

export interface esBuildErrorInterfaces extends Error {
    aggregateErrors?: Array<esBuildAggregateErrorInterface>;
}
