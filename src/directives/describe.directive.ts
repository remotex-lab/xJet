/**
 * Import will remove at compile time
 */

import type { FlagsInterface } from '@models/interfaces/models.interface';
import type { ArgsVoidCallback } from '@directives/interfaces/driective.interface';
import type { DescribeEachInterface, DescribeFunctionInterface } from '@directives/interfaces/describe.interface';

/**
 * Imports
 */

import { each } from '@directives/each.directive';
import { SuiteState } from '@states/suite.state';

/**
 * Dispatches a `describe` block to be added to the current test suite.
 *
 * @param blockFn - The function representing the body of the `describe` block.
 * @param blockName - The name of the `describe` block.
 * @param flags - Flags associated with the `describe` block (e.g., skip, only).
 * @param args - An array of arguments to bind with the `blockFn` when it's executed.
 *               These arguments will be applied to `blockFn` using `Function.prototype.bind`.
 * @throws Error If attempting to nest a `describe` block inside a test case.
 *
 * @example
 * ```ts
 * // Define a describe block with a function and no arguments
 * dispatchDescribe(() => {
 *   // Describe block content here
 * }, 'MyDescribeBlock');
 * ```
 *
 * @example
 * ```ts
 * // Define a describe block with a function and bind arguments
 * dispatchDescribe((arg1, arg2) => {
 *   // Describe block content using arg1 and arg2
 * }, 'MyDescribeBlock', {}, ['value1', 42]);
 * ```
 *
 * @example
 * ```ts
 * // Define a describe block with flags to skip execution
 * dispatchDescribe(() => {
 *   // Describe block content here
 * }, 'MyDescribeBlock', { skip: true });
 * ```
 */

export function dispatchDescribe(
    blockFn: ArgsVoidCallback,
    blockName: string,
    flags: FlagsInterface = {},
    args: Array<unknown> = []
) {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Cannot nest a describe inside a test '${ blockName }' in '${ runningTest.name }'`);
    }

    SuiteState.getInstance().addDescribe(blockName, blockFn.bind(null, ...args), flags);
}

/**
 * Flags to control behaviors and statuses in various directives.
 */

let flags: FlagsInterface = {};

/**
 * Provides a suite of functions for defining and running test suites (describe blocks).
 *
 * @example
 * ```ts
 * // Define a test suite
 * describe('MyTestSuite', () => {
 *     // Define test cases within the suite
 * });
 * ```
 *
 * @example
 * ```ts
 * // Skip a test suite
 * describe.skip('MyTestSuite', () => {
 *     // This suite will be skipped
 * });
 * ```
 *
 * @example
 * ```ts
 * // Run only a specific test suite
 * describe.only('MyTestSuite', () => {
 *     // Only this suite will be run
 * });
 * ```
 *
 * @example
 * ```ts
 * // Use data-driven testing with each
 * describe.each(
 *     [1, 2, 3],
 *     [4, 5, 9],
 * )('Addition', (a, b, expected) => {
 *     test(`should add ${a} + ${b} to equal ${expected}`, () => {
 *         expect(a + b).toBe(expected);
 *     });
 * });
 * ```
 */

const proxy: unknown = new Proxy(() => {}, {
    get(target: unknown, prop: string) {
        switch (prop) {
            case 'skip':
                flags.skip = true;
                break;
            case 'only':
                flags.only = true;
                break;
            case 'each': {
                const eachFn = <DescribeEachInterface>each.bind(null, dispatchDescribe, flags, undefined);
                flags = {};

                return eachFn;
            }
        }

        return proxy;
    },
    apply(target: unknown, thisArg: unknown, argArray: Array<unknown>): void {
        dispatchDescribe(<ArgsVoidCallback> argArray[1], <string> argArray[0], flags);

        // Reset flags after applying
        flags = {};
    }
});

/**
 * A proxy object representing the describe function with additional chaining methods.
 * Allows defining describe blocks, skipping them, running them exclusively, and using data-driven testing with each.
 */

export const describe = <DescribeFunctionInterface>proxy;
