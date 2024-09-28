/**
 * Import will remove at compile time
 */

import type { FlagsInterface } from '@models/interfaces/models.interface';
import type { ArgsVoidCallback } from '@directives/interfaces/driective.interface';
import type { TestEachInterface, TestFunctionInterface } from '@directives/interfaces/test.interface';

/**
 * Imports
 */

import { TestMode } from '@const/test.const';
import { SuiteState } from '@states/suite.state';
import { each } from '@directives/each.directive';

/**
 * Executes a test block with the provided function, name, flags, arguments, and mode.
 *
 * @param blockFn - The function representing the test block logic.
 * @param blockName - The name or identifier for the test block.
 * @param flags - Flags to control behaviors and statuses in the test block (default: {}).
 * @param args - Arguments to pass to the test block function (default: []).
 * @param mode - The mode to control test block behavior (default: TestMode.DEFAULT).
 * @throws Error If trying to nest tests inside another test.
 */

export function testDescribe(
    blockFn: ArgsVoidCallback = () => {
    },
    blockName: string,
    flags: FlagsInterface = {},
    args: Array<unknown> = [],
    mode = TestMode.DEFAULT
) {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Tests cannot be nested. '${ blockName }' in '${ runningTest.name }'`);
    }

    SuiteState.getInstance().addTest(blockName, blockFn.bind(null, ...args), flags, mode);
}

/**
 * Flags to control behaviors and statuses in various tests functions.
 */

let flags: FlagsInterface = {};

/**
 * Mode tto control behaviors and statuses in various tests functions.
 */

let mode = TestMode.DEFAULT;

/**
 * Provides a suite of functions for defining and running test suites (test blocks).
 *
 * @example
 * ```ts
 * import { test } from '@directives/test.directive';
 *
 * test('My Test Suite', () => {
 *  // Test logic here
 * });
 *
 * test.skip('My Skipped Test Suite', () => {
 *  // Test logic here
 * });
 *
 * test.only('My Only Test Suite', () => {
 *   // Test logic here
 * });
 *
 * test.todo('My Todo Test Suite', () => {
 *   // Test logic here
 * });
 *
 * test.failing('My Failing Test Suite', () => {
 *  // Test logic here
 * });
 *
 * test.each(
 *  [1, 2, 3],
 *  [4, 5, 9],
 * )('My Parameterized Test Suite', (a, b, expected) => {
 *  // Test logic here
 * });
 * ```
 */

const proxy: unknown = new Proxy(() => {
}, {
    get(target: unknown, prop: string) {
        switch (prop) {
            case 'skip':
                flags.skip = true;
                break;
            case 'only':
                flags.only = true;
                break;
            case 'todo':
                mode = TestMode.TODO;
                break;
            case 'failing':
                mode = TestMode.FAILING;
                break;
            case 'each': {
                const eachFn = <TestEachInterface>each.bind(null, testDescribe, flags, mode);
                flags = {};
                mode = TestMode.DEFAULT;

                return eachFn;
            }
        }

        return proxy;
    },
    apply(target: unknown, thisArg: unknown, argArray: Array<unknown>): void {
        testDescribe(<ArgsVoidCallback> argArray[1], <string> argArray[0], flags, [], mode);

        // Reset flags after applying
        flags = {};
        mode = TestMode.DEFAULT;
    }
});

/**
 * Exports a proxy object to define and control test suites (test blocks) with various statuses and behaviors.
 */

export const test = <TestFunctionInterface>proxy;
