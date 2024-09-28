/**
 * Import will remove at compile time
 */

import type { AdapterInit, AdapterRequest } from '@adapters/interfaces/adapter.interface';

/**
 * `FilePatterns` is a type representing an array of patterns used to match files.
 *
 * The patterns can either be:
 * - Strings, typically used for glob patterns (e.g., `'*.ts'`, `'src/**\/*.js'`).
 * - Regular expressions (`RegExp`), for more advanced pattern matching.
 *
 * This type is commonly used in file handling scenarios, where both glob-like string patterns and
 * regular expressions need to be supported for selecting or excluding specific files.
 *
 * ### Examples:
 * ```typescript
 * const patterns: FilePatterns = ['*.ts', /test.*\.js$/];
 * ```
 */

export type FilePatterns = Array<string | RegExp>;

/**
 * Represents a deeply nested partial version of a given type `T`.
 *
 * This type utility allows for partial objects at any level of nesting.
 * It recursively makes all properties optional and applies the same behavior to nested objects.
 *
 * **Example Usage:**
 *
 * ```typescript
 * interface User {
 *     name: string;
 *     address: {
 *         street: string;
 *         city: string;
 *     };
 * }
 *
 * // PartialDeep<User> will allow the following:
 * const partialUser: PartialDeep<User> = {
 *     name: 'Alice',        // 'name' is optional
 *     address: {
 *         city: 'Wonderland' // 'street' is optional
 *     }
 * };
 * ```
 *
 * @template T - The type to be made partially optional and deeply nested.
 *
 * @typeParam T - The base type to apply the partial transformation.
 *
 * @example
 * ```
 * type MyPartial = PartialDeep<{ a: number; b: { c: string; d: { e: boolean } } }>;
 * // MyPartial will be equivalent to:
 * // {
 * //   a?: number;
 * //   b?: {
 * //     c?: string;
 * //     d?: {
 * //       e?: boolean;
 * //     }
 * //   }
 * // }
 * ```
 */

export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Represents a module with its exports and an optional default export.
 *
 * This interface provides a structure to define and interact with the exports of a module.
 * It includes both named and default exports, where default exports are of a specific type.
 *
 * @interface ModuleInterface
 *
 * @property exports - An object representing the exports of the module.
 * The keys are strings that represent the names of the exports, and the values can be of any type.
 *
 * @property exports[key: string] - A dictionary where each key is a string representing the export name,
 * and the associated value can be of any type.
 *
 * @property [exports.default] - An optional default export.
 * The default export, if present, is of type `ConfigurationInterface`.
 */

export interface ModuleInterface {

    /**
     * An object representing the exports of the module.
     * The keys are strings representing export names, and the values can be of any type.
     *
     * @property {ConfigurationInterface} [default] - An optional default export of type `ConfigurationInterface`.
     */

    exports: {
        [key: string]: unknown;
        default?: ConfigurationInterface;
    };
}

/**
 * Interface representing the configuration options for the jet test's.
 */

export interface ConfigurationInterface {
    include: FilePatterns,
    exclude: FilePatterns,
    packages: 'bundle' | 'external',
    external: Array<string>,
    adapterInit: AdapterInit,
    adapterRequest: AdapterRequest
}

/**
 * Type alias for a partial configuration object.
 *
 * This type represents a configuration where all properties of the
 * `ConfigurationInterface` are optional. It allows for flexible configuration
 * objects where only a subset of properties need to be specified.
 */

export type xJetConfig = PartialDeep<ConfigurationInterface>;
