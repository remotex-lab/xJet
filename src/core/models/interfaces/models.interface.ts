/**
 * Import will remove at compile time
 */

import type { CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Represents test and describe execution flags.
 * It allows specifying if a test should be skipped or run exclusively.
 *
 * @property skip - Flag indicating whether the test should be skipped.
 * @property only - Flag indicating whether only the flag tests should be run.
 */

export interface FlagsInterface {
    skip?: boolean;
    only?: boolean;
}

/**
 * An interface representing the different types of hooks available in a testing framework.
 *
 * @property afterAll - An array of functions to execute after all tests in a described block.
 * @property beforeAll - An array of functions to execute before all tests in a described block.
 * @property afterEach - An array of functions to execute after each test in a described block.
 * @property beforeEach - An array of functions to execute before each test in a described block.
 */

export interface DescribeHooksInterface {
    afterAll: Array<CallbackHandler>
    beforeAll: Array<CallbackHandler>
    afterEach: Array<CallbackHandler>
    beforeEach: Array<CallbackHandler>
}
