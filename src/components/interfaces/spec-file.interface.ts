/**
 * Import will remove at compile time
 */

import type { transpileFileInterface } from '@services/interfaces/transpiler.interface';

/**
 * Represents a collection of spec files in the project, indexed by their name.
 *
 * The `SpecFilesInterface` defines an object structure where each key is the name of a spec file,
 * and the value is an object of type `transpileFileInterface`, which holds the transpiled code and source map
 * associated with that spec file.
 *
 * @property {Record<string, transpileFileInterface>} [key: string] - The key is the spec file's name (e.g., `example.spec.ts`),
 * and the value is the associated `transpileFileInterface` object containing the transpiled code and source map.
 *
 * @remarks
 * - This interface is useful for managing a set of transpiled spec files in the project, allowing quick access to
 *   the transpiled output of each file by its name.
 * - Each spec file is represented by a `transpileFileInterface` object, which includes the transpiled JavaScript code
 *   and source map.
 *
 * @example
 * const specFiles: SpecFilesInterface = {
 *   'example.spec.ts': {
 *     code: 'console.log("Hello, test!");',
 *     sourceMap: 'version: 3\nfile: out.js\nsources: ["example.spec.ts"]\n'
 *   }
 * };
 *
 * console.log(specFiles['example.spec.ts'].code); // Output: console.log("Hello, test!");
 * console.log(specFiles['example.spec.ts'].sourceMap); // Output: version: 3\nfile: out.js\nsources: ["example.spec.ts"]\n
 *
 * @public
 * @category Interfaces
 */

export interface SpecFilesInterface {
    [key: string]: transpileFileInterface
}
