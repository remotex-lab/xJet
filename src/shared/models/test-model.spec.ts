/**
 * Imports
 */

import { TestModel } from '@shared/models/test.model';
import { FailingError } from '@shared/errors/failing.error';
import * as emitService from '@shared/services/emit.service';
import * as promiseComponent from '@components/promise.component';
import * as timeoutComponent from '@shared/components/timeout.component';
import { HookType } from '@shared/models/constants/hook.model.constants';
import { ActionType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Mock dependencies
 */

jest.mock('@shared/services/emit.service', () => ({
    emitStatus: jest.fn(),
    emitAction: jest.fn()
}));

jest.mock('@shared/components/timeout.component', () => ({
    withTimeout: jest.fn((fn) => fn())
}));

jest.mock('@components/promise.component', () => ({
    isPromise: jest.fn()
}));

global.__XJET = {
    runtime: {
        filter: [],
        suiteId: 'tests-suite-id',
        runnerId: 'test-runner-id'
    }
} as any;

/**
 * Tests
 */

describe('TestModel', () => {
    let testModel: TestModel;
    let mockTestImplementation: jest.Mock;
    let mockContext: any;
    let mockRunLifecycleHooks: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTestImplementation = jest.fn();
        mockRunLifecycleHooks = jest.fn().mockResolvedValue(undefined);
        mockContext = {
            beforeAllErrors: []
        };

        testModel = new TestModel(
            'Test description',
            mockTestImplementation,
            1000, // timeoutDuration
            [], // testParameters
            {} // testOptions
        );
    });

    describe('constructor', () => {
        test('should initialize with the correct properties', () => {
            expect(testModel.description).toBe('Test description');
            expect(testModel.ancestry).toEqual([]);
            expect(testModel.options).toEqual({});
        });
    });

    describe('setExecutionLocation', () => {
        test('should set the execution location', async () => {
            const location = { line: 10, column: 5 };
            testModel.setExecutionLocation(location);
            jest.spyOn(emitService, 'emitAction');
            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitAction).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    location
                })
            );
        });
    });

    describe('applyParentOptions', () => {
        test('should apply parent skip option if test is not already skipped', () => {
            testModel.applyExecutionFlags(true, false);
            expect(testModel.options.skip).toBe(true);
            expect(testModel.options.only).toBe(false);
        });

        test('should apply parent only option if test is not already only', () => {
            testModel.applyExecutionFlags(false, true);
            expect(testModel.options.skip).toBe(false);
            expect(testModel.options.only).toBe(true);
        });

        test('should not override existing test options', () => {
            const testModelWithOptions = new TestModel(
                'Test with options',
                mockTestImplementation,
                1000,
                [],
                { skip: true, only: true }
            );

            testModelWithOptions.applyExecutionFlags(false, false);
            expect(testModelWithOptions.options.skip).toBe(true);
            expect(testModelWithOptions.options.only).toBe(true);
        });
    });

    describe('setAncestry', () => {
        test('should add parent tests to ancestry', () => {
            testModel.setAncestry([ 'Parent 1', 'Parent 2' ]);
            expect(testModel.ancestry).toEqual([ 'Parent 1', 'Parent 2' ]);

            testModel.setAncestry([ 'Parent 3' ]);
            expect(testModel.ancestry).toEqual([ 'Parent 1', 'Parent 2', 'Parent 3' ]);
        });
    });

    describe('run', () => {
        beforeEach(() => {
            jest.spyOn(emitService, 'emitStatus');
            jest.spyOn(emitService, 'emitAction');
        });

        test('should emit start status when test starts', async () => {
            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitStatus).toHaveBeenCalledWith(
                StatusType.START,
                expect.objectContaining({
                    description: 'Test description'
                })
            );
        });

        test('should skip test and emit failure if beforeAllErrors exist', async () => {
            mockContext.beforeAllErrors = [ 'Error 1' ];

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.FAILURE,
                expect.objectContaining({
                    errors: [ 'Error 1' ]
                })
            );
            expect(mockRunLifecycleHooks).not.toHaveBeenCalled();
        });

        test('should emit TODO status for tests with todo flag', async () => {
            testModel = new TestModel(
                'Todo test',
                mockTestImplementation,
                1000,
                [],
                { todo: true }
            );

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitStatus).toHaveBeenCalledWith(
                StatusType.TODO,
                expect.objectContaining({
                    description: 'Todo test'
                })
            );
            expect(mockRunLifecycleHooks).not.toHaveBeenCalled();
        });

        test('should emit SKIP status for tests with skip flag', async () => {
            testModel = new TestModel(
                'Skip test',
                mockTestImplementation,
                1000,
                [],
                { skip: true }
            );

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitStatus).toHaveBeenCalledWith(
                StatusType.SKIP,
                expect.objectContaining({
                    description: 'Skip test'
                })
            );
            expect(mockRunLifecycleHooks).not.toHaveBeenCalled();
        });

        test('should skip tests without only flag in exclusive mode', async () => {
            const isExclusiveMode = true;

            await testModel.run(mockContext, mockRunLifecycleHooks, isExclusiveMode);

            expect(emitService.emitStatus).toHaveBeenCalledWith(
                StatusType.SKIP,
                expect.objectContaining({
                    description: 'Test description'
                })
            );
            expect(mockRunLifecycleHooks).not.toHaveBeenCalled();
        });

        test('should run tests with only flag in exclusive mode', async () => {
            testModel = new TestModel(
                'Only test',
                mockTestImplementation,
                1000,
                [],
                { only: true }
            );
            const isExclusiveMode = true;

            await testModel.run(mockContext, mockRunLifecycleHooks, isExclusiveMode);

            expect(mockRunLifecycleHooks).toHaveBeenCalled();
        });

        test('should run lifecycle hooks in the correct order', async () => {
            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(mockRunLifecycleHooks).toHaveBeenCalledTimes(2);
            expect(mockRunLifecycleHooks).toHaveBeenNthCalledWith(1, HookType.BEFORE_EACH, mockContext);
            expect(mockRunLifecycleHooks).toHaveBeenNthCalledWith(2, HookType.AFTER_EACH, mockContext);
        });

        test('should emit success action on successful test completion', async () => {
            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.SUCCESS,
                expect.objectContaining({
                    description: 'Test description'
                })
            );
        });

        test('should emit failure action when test throws an error', async () => {
            const testError = new Error('Test failed');
            mockTestImplementation.mockRejectedValue(testError);

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.FAILURE,
                expect.objectContaining({
                    errors: [ testError ]
                })
            );
        });

        test('should throw FailingError for tests with failing flag', async () => {
            testModel = new TestModel(
                'Failing test',
                mockTestImplementation,
                1000,
                [],
                { failing: true }
            );

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.FAILURE,
                expect.objectContaining({
                    errors: [ expect.any(FailingError) ]
                })
            );
        });
    });

    describe('executeTestWithContext', () => {
        test('should correctly execute synchronous tests', async () => {
            jest.spyOn(promiseComponent, 'isPromise').mockReturnValue(false);
            mockTestImplementation.mockImplementation(() => 'result');

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(mockTestImplementation).toHaveBeenCalled();
            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.SUCCESS,
                expect.anything()
            );
        });

        test('should correctly execute asynchronous tests', async () => {
            jest.spyOn(promiseComponent, 'isPromise').mockReturnValue(true);
            mockTestImplementation.mockResolvedValue('result');

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(mockTestImplementation).toHaveBeenCalled();
            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.SUCCESS,
                expect.anything()
            );
        });

        test('should correctly execute callback-style tests', async () => {
            // Mock a callback-style test implementation
            mockTestImplementation = jest.fn().mockImplementation((done) => {
                setTimeout(() => {
                    done();
                }, 10);
            });

            // Create a new test model with the callback-style implementation
            testModel = new TestModel(
                'Callback test',
                mockTestImplementation,
                1000
            );

            // Make isCallbackStyle return true
            jest.spyOn(promiseComponent, 'isPromise').mockReturnValue(false);

            // We need to mock the private isCallbackStyle method, which is tricky
            // For this test, we'll use the fact that the callback test has length = 1
            Object.defineProperty(mockTestImplementation, 'length', { value: 1 });

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(mockTestImplementation).toHaveBeenCalled();
            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.SUCCESS,
                expect.anything()
            );
        });

        test('should handle test timeouts correctly', async () => {
            jest.spyOn(timeoutComponent, 'withTimeout').mockImplementation((fn, timeout, message) => {
                throw new Error(`Timeout: ${ message }`);
            });

            await testModel.run(mockContext, mockRunLifecycleHooks);

            expect(timeoutComponent.withTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                1000,
                '\'1000\' test'
            );

            expect(emitService.emitAction).toHaveBeenCalledWith(
                ActionType.FAILURE,
                expect.objectContaining({
                    errors: [ expect.any(Error) ]
                })
            );
        });
    });
});
