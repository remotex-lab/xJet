/**
 * Import will remove at compile time
 */

import type { ArgsVoidCallback, AsyncArgsVoidCallback } from '@directives/interfaces/driective.interface';
import type { FlagsInterface } from '@models/interfaces/models.interface';
import { TestMode } from '@const/test.const';

/**
 * Imports
 */

/**
 * Parses a template string containing data placeholders and splits the input data into subarrays based on the template headings.
 *
 * @param templateString - A template string with placeholders representing column headings and data values.
 *   - The first element should contain the headings separated by pipes ('|').
 *   - Subsequent elements (if any) can interpolate data values using string interpolation syntax (`${placeholder}`).
 * @param inputData - An array containing data values to be parsed and matched with the template headings.
 *   - The expected length of `inputData` should be a multiple of the number of headings in the template string.
 * @returns An array of subarrays, where each sub-list represents a row of data based on the parsed template and matched input values.
 * @throws Error If the first element of the template string (headings) is empty or contains no pipe delimiters.
 * @throws Error If the length of inputData is not a multiple of the number of headings.
 *
 * @example
 * ``` typescript
 * const templateString = [`
 *   a    | b    | expected
 *   ${ 1 } | ${ 1 } | ${ 2 }
 *   ${ 1 } | ${ 2 } | ${ 3 }
 *   ${ 2 } | ${ 1 } | ${ 3 }
 * `];
 *
 * const inputData = [1, 1, 2, 1, 2, 3, 2, 1, 3];
 *
 * const result = parseTemplate(templateString, inputData);
 *
 * // Output:
 * // [
 * // [1, 1, 2],
 * // [1, 2, 3],
 * // [2, 1, 3]
 * // ]
 * ```
 */

export function parseTemplate(templateString: TemplateStringsArray, inputData: Array<unknown>): Array<unknown[]> {
    // Extract the column headings and remove any leading/trailing whitespace
    const headings: string[] = templateString[0].split('|').map((h: string) => h.trim());

    if (headings.length === 0 || headings.some((h) => h === '')) {
        throw new Error('Template string headings must not be empty and should contain pipe delimiters.');
    }

    if ((inputData.length % headings.length) !== 0) {
        throw new Error('Not enough arguments supplied for given headings.');
    }

    // Create an empty array to store the split subarrays
    const result: Array<unknown[]> = [];

    // Loop through the original array in steps of the number of headings
    for (let i = 0; i < inputData.length; i += headings.length) {
        // Slice a subarray of elements from the original array
        const subArray = inputData.slice(i, i + headings.length);

        // Push the subarray to the result array
        result.push(subArray);
    }

    // Return the array of split subarrays
    return result;
}

/**
 * A versatile function for iterating over different data structures and executing functions for each case.
 *
 * @param executor - The function to execute each test case against.
 * @param flags - Flags associated with the test cases (e.g., skip, only).
 * @param mode - The execution mode of the described block ('default', 'to\do', 'failing').
 * @param args - Accepts an array of cases or a template string with cases.
 *
 * @example
 * ``` typescript
 * // Example with array of arrays
 * each(
 *   [1, 2],
 *   [3, 4]
 * )('sum', ([num1, num2]) => console.log(num1 + num2)); // Output: 3, 7
 * ```
 *
 * @example
 * ``` typescript
 * // Example with nested arrays
 * each(
 *   ['apple', 'red'],
 *   ['banana', 'yellow'],
 * )('printFruit', ([fruit, color]) => console.log(`${fruit} is ${color}`)); // Output: apple is red, banana is yellow
 * ```
 *
 * @example
 * ``` typescript
 * // Example with template strings
 * each`
 *   a    | b    | expected
 *   ${ 1 } | ${ 1 } | ${ 2 }
 *   ${ 1 } | ${ 2 } | ${ 3 }
 *   ${ 2 } | ${ 1 } | ${ 3 }
 * `('$a + $b', async ([a, b, expected], done) => {
 * });
 * ```
 *
 * @returns A function to define test cases.
 */

export function each<T extends Array<any>>(
    executor: ArgsVoidCallback,
    flags: FlagsInterface,
    mode: TestMode = TestMode.DEFAULT,
    ...args: T
) {
    if (args.length < 2) {
        throw new Error('`.each` must be called with at leas 2 argument or Tagged Template Literal.');
    }

    const isTemplateStrings = args[0] instanceof Array && (<any>args[0]).raw !== undefined;
    const cases: Array<unknown> = isTemplateStrings ? parseTemplate(args.shift(), args) : args;

    return (blockName: string, blockFn: ArgsVoidCallback | AsyncArgsVoidCallback) => {
        for (const caseArgs of cases) {
            const parseArgs = Array.isArray(caseArgs) ? caseArgs : [ caseArgs ];
            executor.call(null, blockFn, blockName, flags, parseArgs, mode);
        }
    };
}
