/**
 * Import will remove at compile time
 */

import type { TestModel } from '@shared/models/test.model';

/**
 * Imports
 */

import { SuiteState } from '@shared/states/suite.state';
import { encodeErrorSchema } from '@schema/action.schema';
import { emitStatus } from '@shared/services/emit.service';
import { DescribeModel } from '@shared/models/describe.model';
import { KindType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Mock dependencies
 */

global.__XJET = {
    runtime: {
        filter: [],
        suiteId: 'tests-suite-id',
        runnerId: 'test-runner-id'
    }
} as any;

jest.mock('@schema/action.schema');
jest.mock('@shared/services/emit.service');

/**
 * Tests
 */

describe('SuiteState', () => {
    beforeEach(() => {
        // Reset the singleton instance before each test
        (<any>SuiteState).instance = undefined;
    });

    describe('Singleton pattern', () => {
        test('should always return the same instance', () => {
            const instance1 = SuiteState.getInstance();
            const instance2 = SuiteState.getInstance();
            expect(instance1).toBe(instance2);
        });

        test('should create a new instance after reset', () => {
            const instance1 = SuiteState.getInstance();
            (<any>SuiteState).instance = undefined;
            const instance2 = SuiteState.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('Initial state', () => {
        test('should initialize with default values', () => {
            const state = SuiteState.getInstance();
            expect(state.isOnlyMode).toBe(false);
            expect(state.root).toBeInstanceOf(DescribeModel);
            expect(state.describe).toBe(state.root);
            expect(state.test).toBeUndefined();
        });
    });

    describe('Test management', () => {
        test('should set and get the current test', () => {
            const state = SuiteState.getInstance();
            const testModel = { options: {} } as TestModel;

            state.test = testModel;
            expect(state.test).toBe(testModel);
        });
    });

    describe('addDescribe method', () => {
        test('should add a describe block to the current describe', () => {
            const state = SuiteState.getInstance();
            const describeFn = jest.fn();

            state.addDescribe('test description', describeFn);

            expect(describeFn).toHaveBeenCalled();
            expect(state.root.describesStack.length).toBe(1);
            expect(state.root.describesStack[0].description).toBe('test description');
        });

        test('should enable only mode when options.only is true', () => {
            const state = SuiteState.getInstance();
            const describeFn = jest.fn();

            expect(state.isOnlyMode).toBe(false);
            state.addDescribe('only test', describeFn, { only: true });
            expect(state.isOnlyMode).toBe(true);
        });

        test('should maintain the describe hierarchy when nesting describes', () => {
            const state = SuiteState.getInstance();

            state.addDescribe('parent', () => {
                state.addDescribe('child', () => {
                    // Nested describe
                });
            });

            expect(state.root.describesStack.length).toBe(1);
            expect(state.root.describesStack[0].description).toBe('parent');
            expect(state.root.describesStack[0].describesStack.length).toBe(1);
            expect(state.root.describesStack[0].describesStack[0].description).toBe('child');
        });

        test('should restore the current describe after execution', () => {
            const state = SuiteState.getInstance();
            const parentDescribe = state.describe;

            state.addDescribe('test', () => {
                // Inside the describe function, currentDescribe should be the new one
                expect(state.describe).not.toBe(parentDescribe);
            });

            // After execution, it should be restored
            expect(state.describe).toBe(parentDescribe);
        });

        test('should restore the current describe even if the describe function throws', () => {
            const state = SuiteState.getInstance();
            const parentDescribe = state.describe;

            expect(() => {
                state.addDescribe('error test', () => {
                    throw new Error('Test error');
                });
            }).toThrow('Test error');

            // Should still restore the current describe
            expect(state.describe).toBe(parentDescribe);
        });

        test('should apply arguments to the describe function', () => {
            const state = SuiteState.getInstance();
            const describeFn = jest.fn();
            const args = [ 'arg1', 'arg2' ];

            state.addDescribe('with args', describeFn, {}, args);

            expect(describeFn).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });

    describe('addTest method', () => {
        test('should add a test to the current describe block', () => {
            const state = SuiteState.getInstance();
            const testModel: any = {
                options: {},
                setAncestry: jest.fn(),
                applyExecutionFlags: jest.fn()
            };

            state.addTest(testModel);

            expect(state.root.tests.length).toBe(1);
            expect(state.root.tests[0]).toBe(testModel);
            expect(testModel.setAncestry).toBeCalledWith([]);
            expect(testModel.applyExecutionFlags).toBeCalledWith(false, false);
        });

        test('should enable only mode when test.options.only is true', () => {
            const state = SuiteState.getInstance();
            const testModel: any = {
                options: { only: true },
                setAncestry: jest.fn(),
                applyExecutionFlags: jest.fn()
            };

            expect(state.isOnlyMode).toBe(false);
            state.addTest(testModel);
            expect(state.isOnlyMode).toBe(true);
            expect(testModel.setAncestry).toBeCalledWith([]);
            expect(testModel.applyExecutionFlags).toBeCalledWith(false, false);
        });

        test('should add tests to the correct describe block in nested describes', () => {
            const state = SuiteState.getInstance();
            const testModel1: any = {
                options: {},
                setAncestry: jest.fn(),
                applyExecutionFlags: jest.fn()
            };

            const testModel2: any = {
                options: {},
                setAncestry: jest.fn(),
                applyExecutionFlags: jest.fn()
            };

            state.addDescribe('parent', () => {
                state.addTest(testModel1);

                state.addDescribe('child', () => {
                    state.addTest(testModel2);
                });
            });

            expect(state.root.describesStack[0].testsStack.length).toBe(1);
            expect(state.root.describesStack[0].testsStack[0]).toBe(testModel1);

            expect(state.root.describesStack[0].describesStack[0].testsStack.length).toBe(1);
            expect(state.root.describesStack[0].describesStack[0].testsStack[0]).toBe(testModel2);
            expect(testModel1.setAncestry).toBeCalledWith([ 'parent' ]);
            expect(testModel1.applyExecutionFlags).toBeCalledWith(false, false);
            expect(testModel2.setAncestry).toBeCalledWith([ 'child' ]);
            expect(testModel2.applyExecutionFlags).toBeCalledWith(false, false);
        });
    });

    describe('run method', () => {
        let state: SuiteState;
        let mockRootRun: jest.SpyInstance;

        beforeEach(() => {
            // Reset the singleton instance
            (<any>SuiteState).instance = undefined;
            state = SuiteState.getInstance();
            (<any>state).hasTests = true;

            // Set up mocks
            mockRootRun = jest.spyOn(state.root, 'run').mockResolvedValue(undefined);

            // Mock the imported functions
            global.dispatch = jest.fn();
            (<any>encodeErrorSchema).mockReturnValue('encoded-error');

            // Mock the global XJET runtime object
            global.__XJET = {
                runtime: {
                    suiteId: 'test-suite-id',
                    runnerId: 'test-runner-id'
                }
            } as any;
        });

        afterEach(() => {
            jest.clearAllMocks();
            (global as any).__XJET = undefined;
            (global as any).dispatch = undefined;
        });

        test('should execute root describe block and emit end status on success', async () => {
            mockRootRun.mockResolvedValueOnce('');
            await state.run(<any>{ test: 'some-test' });

            // Assert
            expect(mockRootRun).toHaveBeenCalledWith({ test: 'some-test' });
            expect(emitStatus).toHaveBeenCalledWith(StatusType.END, {
                kind: KindType.SUITE,
                ancestry: [],
                description: ''
            });
            expect(dispatch).not.toHaveBeenCalled();
        });

        test('should handle and dispatch errors that occur during execution', async () => {
            // Arrange
            const testError = new Error('Test execution failed');
            mockRootRun.mockRejectedValue(testError);

            // Act
            await state.run(<any>{});

            // Assert
            expect(mockRootRun).toHaveBeenCalledWith({});
            expect(emitStatus).not.toHaveBeenCalled();
            expect(encodeErrorSchema).toHaveBeenCalledWith(
                testError,
                'test-suite-id',
                'test-runner-id'
            );
            expect(dispatch).toHaveBeenCalledWith('encoded-error');
        });

        test('should not swallow errors but encode and dispatch them', async () => {
            // Arrange
            mockRootRun.mockImplementation(() => {
                throw new Error('Synchronous error');
            });

            // Act
            await state.run(<any>{});

            // Assert
            expect(dispatch).toHaveBeenCalled();
            expect(encodeErrorSchema).toHaveBeenCalledWith(
                expect.any(Error),
                'test-suite-id',
                'test-runner-id'
            );
        });

        test('should not emit end status if there are no tests', async () => {
            (<any>state).hasTests = false;
            await state.run(<any>{});

            expect(emitStatus).not.toHaveBeenCalled();
            expect(dispatch).toHaveBeenCalled();
            expect(encodeErrorSchema).toHaveBeenCalledWith(
                expect.any(Error),
                'test-suite-id',
                'test-runner-id'
            );
        });
    });
});

describe('SuiteState.matchesFilter', () => {
    describe('Basic matching', () => {
        test('should return true when filter exactly matches path', () => {
            const path = [ 'Auth', 'User', 'Login' ];
            const filter = [ /^Auth$/, /^User$/, /^Login$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });

        test('should return false when filter does not match path', () => {
            const path = [ 'Auth', 'User', 'Login' ];
            const filter = [ /^Auth$/, /^Admin$/, /^Login$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(false);
        });
    });

    describe('Filter alignment', () => {
        test('should align filter from the end of path and match properly', () => {
            const path = [ 'Root', 'Auth', 'User', 'Login' ];
            const filter = [ /^User$/, /^Login$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });

        test('should return false when filter is longer than path', () => {
            const path = [ 'User', 'Login' ];
            const filter = [ /^Root$/, /^Auth$/, /^User$/, /^Login$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(false);
        });

        test('should handle single-element filter and path properly', () => {
            const path = [ 'Login' ];
            const filter = [ /^Login$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);

            const nonMatchingFilter = [ /^Logout$/ ];
            expect(SuiteState.matchesFilter(path, nonMatchingFilter)).toBe(false);
        });
    });

    describe('Regex pattern variations', () => {
        test('should match case-insensitive patterns', () => {
            const path = [ 'Auth', 'User', 'LOGIN' ];
            const filter = [ /^login$/i ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });

        test('should match partial strings using regex patterns', () => {
            const path = [ 'API', 'User Authentication', 'should validate credentials' ];
            const filter = [ /Authentication/, /validate/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });

        test('should match using regex wildcards', () => {
            const path = [ 'API', 'GET /users', 'returns user data' ];
            const filter = [ /GET.*/, /.*data$/ ];

            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });
    });

    describe('Complex scenarios', () => {
        test('should match specific leaf nodes within test hierarchy', () => {
            const path = [ 'API', 'Authentication', 'Login', 'should accept valid credentials' ];

            // Match only the specific test
            const specificFilter = [ /Login/, /accept valid/ ];
            expect(SuiteState.matchesFilter(path, specificFilter)).toBe(true);

            // Should not match other tests in same group
            const otherPath = [ 'API', 'Authentication', 'Login', 'should reject invalid credentials' ];
            expect(SuiteState.matchesFilter(otherPath, [ /Login/, /accept valid/ ])).toBe(false);
        });

        test('should match all tests in a group using broader pattern', () => {
            const loginPath = [ 'API', 'Authentication' ];
            const registerPath = [ 'API2', 'Authentication' ];

            const groupFilter = [ /^Authentication$/ ];
            expect(SuiteState.matchesFilter(loginPath, groupFilter)).toBe(true);
            expect(SuiteState.matchesFilter(registerPath, groupFilter)).toBe(true);
        });

        test('should handle empty filter array by matching any path', () => {
            const path = [ 'Auth', 'User', 'Login' ];
            const emptyFilter: RegExp[] = [];

            expect(SuiteState.matchesFilter(path, emptyFilter)).toBe(true);

            // Even empty path should match empty filter
            expect(SuiteState.matchesFilter([], emptyFilter)).toBe(true);
        });
    });

    describe('Edge cases', () => {
        test('should handle empty path', () => {
            const emptyPath: string[] = [];
            const filter = [ /^Login$/ ];

            expect(SuiteState.matchesFilter(emptyPath, filter)).toBe(false);
        });

        test('should handle special regex characters in test names', () => {
            const path = [ 'API', 'GET /items/{id}' ];

            const filter = [ /GET \/items\/\{id\}/ ];
            expect(SuiteState.matchesFilter(path, filter)).toBe(true);
        });

        test('should match with lookaheads and lookbehinds in regex', () => {
            // Test name contains version numbers we want to match with regex
            const path = [ 'Login function', 'Authentication v1.5' ];

            // More specific matching with lookahead to ensure "Authentication" comes before version
            const specificFilter = [ /Authentication(?= v\d+\.\d+)/ ];
            expect(SuiteState.matchesFilter(path, specificFilter)).toBe(true);
        });
    });
});

