/**
 * Import will remove at compile time
 */

import type { VoidCallback } from '@directives/interfaces/driective.interface';

/**
 * Represents a function for describing and running multiple test cases.
 */

export interface DescribeEachInterface {

    /**
     * Defines a suite of test cases, each executed with different arguments.
     *
     * @template T The type of the test cases.
     * @param args An array of test arg.
     * @returns A function that accepts the test suite name and the test function.
     *
     * @example
     * describeEach(1, 2, 3)('should be a number', (num) => {
     *     expect(typeof num).toBe('number');
     * });
     */

        <T>(...args: readonly T[]): (name: string, fn: (...args: T[]) => any) => void;

    /**
     * Defines a suite of test cases, each executed with different arguments.
     *
     * @template T The type of the test cases array.
     * @param args An array of test arg.
     * @returns A function that accepts the test suite name, the test function, and an optional timeout.
     *
     * @example
     * describeEach([ 1, 2, 3 ])('should add two numbers', (a, b) => {
     *     expect(a + b).toBeGreaterThanOrEqual(2);
     * });
     *
     * @example
     * describeEach(
     *     [ 1, 2 ],
     *     [ 3, 4 ]
     * )('should add two numbers', (a, b) => {
     *     expect(a + b).toBeGreaterThanOrEqual(2);
     * });
     */

        <T extends any[] | [ any ]>(...args: readonly T[]): (
        name: string,
        fn: (...args: T) => any
    ) => void;

    /**
     * Defines a suite of test cases using a template literal for the test suite name.
     *
     * @param strings The template literal string.
     * @param placeholders Values to be interpolated into the template literal.
     * @returns A function that accepts the test function and an optional timeout.
     *
     * @example
     * describeEach`Adding ${1} and ${2}`('should equal 3', () => {
     *     expect(1 + 2).toBe(3);
     * });
     */

    (strings: TemplateStringsArray, ...placeholders: any[]): (
        name: string,
        fn: (...arg: any[]) => any
    ) => void;
}

/**
 * Represents the core "describe" function interface for grouping tests.
 *
 * @param describeName - The name or description of the test suite.
 * @param describeCallback  - An optional callback function that defines the tests within this suite.
 *
 * @property skip - Skips the entire test suite defined by this `describe` block.
 * @property only - Only runs the test suite defined by this `describe` block. All other test suites will be skipped.
 * @property each - Provides utilities for running parameterized tests within this `describe` block. Uses the `TestEachInterface`.
 */

export interface DescribeFunctionInterface {
    (describeName: string, describeCallback: VoidCallback): void;

    skip: DescribeFunctionInterface;
    only: DescribeFunctionInterface;
    each: DescribeEachInterface;
}
