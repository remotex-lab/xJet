/**
 * Imports
 */

import { TestModel } from '@shared/models/test.model';
import { SuiteState } from '@shared/states/suite.state';
import { TestDirective } from '@shared/directives/test.directive';
import { getInvocationLocation } from '@shared/components/location.component';

/**
 * Mock dependencies
 */

jest.mock('@shared/models/test.model');
jest.mock('@shared/states/suite.state');
jest.mock('@shared/components/location.component');

/**
 * Tests
 */

describe('TestDirective', () => {
    let testDirective: any;
    let mockSuiteState: jest.Mocked<SuiteState>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock SuiteState instance
        mockSuiteState = {
            test: null,
            addTest: jest.fn()
        } as unknown as jest.Mocked<SuiteState>;

        (SuiteState.getInstance as jest.Mock).mockReturnValue(mockSuiteState);

        // Mock location component
        (getInvocationLocation as jest.Mock).mockReturnValue({
            line: 10,
            column: 5
        });

        // Get instance of TestDirective
        testDirective = TestDirective.getInstance();
    });

    describe('getInstance', () => {
        test('should return a singleton instance', () => {
            const instance1 = TestDirective.getInstance();
            const instance2 = TestDirective.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('direct invocation', () => {
        test('should create and register a test when invoked as a function', () => {
            const testDescription = 'test description';
            const testFn = jest.fn();
            const timeout = 10000;

            testDirective(testDescription, testFn, timeout);

            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                testFn,
                timeout,
                [],
                {}
            );
            expect(mockSuiteState.addTest).toHaveBeenCalled();
        });

        test('should use default timeout when not specified', () => {
            const testDescription = 'test description';
            const testFn = jest.fn();

            testDirective(testDescription, testFn);

            // Check that TestModel was called with the default timeout (5000)
            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                testFn,
                5000,
                [],
                {}
            );
        });
    });

    describe('flag modifiers', () => {
        test('should set the skip flag', () => {
            const testDescription = 'skipped test';
            const testFn = jest.fn();

            testDirective.skip(testDescription, testFn);

            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                testFn,
                5000,
                [],
                { skip: true }
            );
        });

        test('should set the only flag', () => {
            const testDescription = 'only test';
            const testFn = jest.fn();

            testDirective.only(testDescription, testFn);

            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                testFn,
                5000,
                [],
                { only: true }
            );
        });

        test('should set the todo flag', () => {
            const testDescription = 'todo test';

            testDirective.todo(testDescription);

            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                undefined,
                5000,
                [],
                { todo: true }
            );
        });

        test('should set the failing flag', () => {
            const testDescription = 'failing test';
            const testFn = jest.fn();

            testDirective.failing(testDescription, testFn);

            expect(TestModel).toHaveBeenCalledWith(
                testDescription,
                testFn,
                5000,
                [],
                { failing: true }
            );
        });

        test('should throw an error when combining skip and only options', () => {
            testDirective.options = {};
            expect(() => {
                testDirective.skip.only('invalid test', jest.fn());
            }).toThrow('Cannot use "only" flag on skipped test');

            testDirective.options = {};
            expect(() => {
                testDirective.only.skip('invalid test', jest.fn());
            }).toThrow('Cannot use "skip" flag on only test');
        });
    });

    describe('test nesting validation', () => {
        test('should throw an error when nesting tests', () => {
            // Setup a running test
            mockSuiteState.test = { description: 'outer test' } as TestModel;

            expect(() => {
                testDirective('nested test', jest.fn());
            }).toThrow(/Cannot nest a test inside a test/);
        });
    });

    describe('each method', () => {
        test('should handle array test cases', () => {
            const testFn = jest.fn();
            const testCallback = testDirective.each([ 1, 2 ], [ 3, 4 ]);

            testCallback('test with %s and %s', testFn);

            // We're not testing the each directive itself, just that it's correctly
            // wired up to the test directive
            expect(mockSuiteState.addTest).toHaveBeenCalled();
        });
    });
});
