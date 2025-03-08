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
 * Represents a complete ESBuild error with location and context information
 *
 * @example
 * ```ts
 * const buildError: esBuildErrorInterface = {
 *   id: 'error001',
 *   text: 'Could not resolve module "fs"',
 *   location: {
 *     file: 'src/index.ts',
 *     line: 10,
 *     column: 15,
 *     length: 4,
 *     lineText: 'import { readFile } from "fs";',
 *     namespace: '',
 *     suggestion: 'Try installing @types/node'
 *   },
 *   notes: [{ text: 'This module is a Node.js built-in module' }],
 *   pluginName: 'typescript'
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface esBuildErrorInterface {
    id: string;
    text: string;
    notes: Array<{
        text: string;
    }>;
    detail?: string;
    location: esBuildLocationInterface;
    pluginName: string;
}
