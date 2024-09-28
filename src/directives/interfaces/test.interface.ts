/**
 * Import will remove at compile time
 */

import type { CallbackHandler, VoidCallback } from '@directives/interfaces/driective.interface';

/**
 * Represents a function for describing and running multiple test cases.
 */

export interface TestEachInterface {
    /**
     * Defines a suite of test cases, each executed with different arguments.
     *
     * @template T The type of the test cases.
     * @param args An array of test arguments.
     * @returns A function that accepts the test suite name and the test function.
     *
     * @example
     * testEach(1, 2, 3)('should be a number', (num, done) => {
     *     expect(typeof num).toBe('number');
     *     done();
     * });
     */

        <T>(...args: readonly T[]): (name: string, fn: (args: T, done: VoidCallback) => void) => void;

    /**
     * Defines a suite of test cases, each executed with different arguments.
     *
     * @template T The type of the test cases array.
     * @param args An array of test arguments.
     * @returns A function that accepts the test suite name, the test function.
     *
     * @example
     * testEach([ 1, 2, 3 ])('should add two numbers', (a, done) => {
     *     expect(a[0] + b[1]).toBeGreaterThanOrEqual(a[2]);
     *     done();
     * });
     *
     * @example
     * testEach(
     *     [ 1, 2 ],
     *     [ 3, 4 ]
     * )('should add two numbers', ([a, b], done) => {
     *     expect(a + b).toBeGreaterThanOrEqual(2);
     *     done();
     * });
     */

        <T extends unknown[] | [ unknown ]>(args: readonly T[]): (
        name: string,
        fn: (args: T, done: VoidCallback) => void
    ) => void;

    /**
     * Defines a suite of test cases using a template literal for the test suite name.
     *
     * @param strings The template literal string.
     * @param placeholders Values to be interpolated into the template literal.
     * @returns A function that accepts the test function.
     *
     * @example
     * testEach`Adding ${1} and ${2}`('should equal 3', (args, done) => {
     *     expect(1 + 2).toBe(3);
     *     done();
     * });
     */

    (strings: TemplateStringsArray, ...placeholders: unknown[]): (
        name: string,
        fn: (args: unknown[], done: VoidCallback) => void
    ) => void;
}

/**
 * Represents the core "test" function interface.
 *
 * @param testName - The name or description of the test block.
 * @param testCallback - An optional callback function that defines the test logic.
 *
 * @property only - A nested function for running only this specific test block.
 * @property skip - A nested function for skipping this specific test block.
 * @property todo - A nested function for marking this specific test block as "to-do".
 * @property failing - A nested function for marking this specific test block as expected to fail.
 * @property each - A nested interface (TestEachInterface) for defining data-driven tests.
 */

export interface TestFunctionInterface {
    (testName: string, testCallback: CallbackHandler): void;

    only: TestFunctionInterface;
    skip: TestFunctionInterface;
    todo: TestFunctionInterface;
    failing: TestFunctionInterface;
    each: TestEachInterface;
}
