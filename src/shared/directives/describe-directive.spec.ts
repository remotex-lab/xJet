/**
 * Imports
 */

import { SuiteState } from '@shared/states/suite.state';
import { DescribeDirective } from '@shared/directives/describe.directive';

/**
 * Mock dependencies
 */

jest.mock('@shared/states/suite.state', () => ({
    SuiteState: {
        getInstance: jest.fn()
    }
}));

/**
 * Tests
 */

describe('DescribeDirective', () => {
    let mockSuiteState: any;
    let describeDirective: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock the suite state
        mockSuiteState = {
            test: null,
            addDescribe: jest.fn()
        };

        (SuiteState.getInstance as jest.Mock).mockReturnValue(mockSuiteState);

        (<any> DescribeDirective).instance = undefined;
        describeDirective = DescribeDirective.getInstance();
    });

    describe('getInstance', () => {
        test('should return the same instance when called multiple times', () => {
            const instance1 = DescribeDirective.getInstance();
            const instance2 = DescribeDirective.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('invoke', () => {
        test('should call SuiteState.addDescribe with correct parameters', () => {
            const description = 'Test description';
            const block = jest.fn();
            const args: unknown[] = [];

            describeDirective.invoke(description, block, args);

            expect(mockSuiteState.addDescribe).toHaveBeenCalledWith(
                description,
                block,
                {}, // empty flags object
                args
            );
        });

        test('should throw an error when nesting a describe inside a test', () => {
            const testDescription = 'Running test';
            const description = 'Nested describe';
            const block = jest.fn();

            // Set up the mock to simulate being inside a test
            mockSuiteState.test = {
                description: testDescription
            };

            expect(() => {
                describeDirective.invoke(description, block);
            }).toThrow(`Cannot nest a describe inside a test '${description}' in '${testDescription}'`);
        });

        test('should reset flags after invoking', () => {
            const description = 'Test with flags';
            const block = jest.fn();

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            describeDirective.only;
            expect((describeDirective as any).flags.only).toBe(true);

            describeDirective.invoke(description, block);
            expect(mockSuiteState.addDescribe).toHaveBeenCalledWith(
                description,
                block,
                { only: true },
                []
            );

            // Verify the flags were reset
            expect((describeDirective as any).flags).toEqual({});
        });
    });

    describe('skip flag', () => {
        test('should set the skip flag correctly', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            describeDirective.skip;
            expect((describeDirective as any).flags.skip).toBe(true);
        });

        test('should throw an error when used with the only flag', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            describeDirective.only;

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                describeDirective.skip;
            }).toThrow('Cannot use "skip" flag on only test');
        });
    });

    describe('only flag', () => {
        test('should set the only flag correctly', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            describeDirective.only;

            expect((describeDirective as any).flags.only).toBe(true);
        });

        test('should throw an error when used with the skip flag', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            describeDirective.skip;

            expect(() => {
                describeDirective.only();
            }).toThrow('Cannot use "only" flag on skipped test');
        });
    });

    describe('each method', () => {
        test('should return a function that calls invoke with the correct context', () => {
            const invokeSpy = jest.spyOn(describeDirective, 'invoke');
            const eachCallback = describeDirective.each(1, 2, 3);
            const description = 'Test with %d';
            const block = jest.fn();

            eachCallback(description, block);
            expect(invokeSpy).toHaveBeenCalled();
        });
    });
});
