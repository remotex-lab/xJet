/**
 * Imports
 */

import * as emitService from '@shared/services/emit.service';
import { DescribeModel } from '@shared/models/describe.model';
import { HookType } from '@shared/models/constants/hook.model.constants';
import { ActionType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Mock dependencies
 */

jest.mock('@shared/services/emit.service');

/**
 * Tests
 */

describe('DescribeModel', () => {
    let describeModel: DescribeModel;
    let mockContext: any;
    let mockTest: any;
    let mockHook: any;
    let mockChildDescribe: DescribeModel;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create basic instance for testing
        describeModel = new DescribeModel('Test Suite');

        // Mock context for testing
        mockContext = {
            beforeAllErrors: [],
            afterAllErrors: []
        };

        // Mock test object
        mockTest = {
            setAncestry: jest.fn(),
            applyExecutionFlags: jest.fn(),
            run: jest.fn().mockResolvedValue(undefined)
        };

        // Mock hook object
        mockHook = {
            run: jest.fn().mockResolvedValue(undefined)
        };

        // Mock child describe
        mockChildDescribe = new DescribeModel('Child Suite');
        mockChildDescribe.run = jest.fn().mockResolvedValue(undefined);
        mockChildDescribe.inheritFromParentDescribe = jest.fn();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(describeModel.description).toBe('Test Suite');
            expect(describeModel.ancestry).toEqual([]);
            expect(describeModel.options).toEqual({ skip: false, only: false });
            expect(describeModel.tests).toEqual([]);
        });

        test('should initialize with provided values', () => {
            const customDescribe = new DescribeModel('Custom Suite', { skip: true, only: false });
            expect(customDescribe.description).toBe('Custom Suite');
            expect(customDescribe.options).toEqual({ skip: true, only: false });
        });
    });

    describe('addTest', () => {
        test('should add a test to the test stack', () => {
            describeModel.addTest(mockTest);
            expect(mockTest.setAncestry).toHaveBeenCalledWith([ 'Test Suite' ]);
            expect(mockTest.applyExecutionFlags).toHaveBeenCalledWith(false, false);
        });

        test('should not add a null or undefined test', () => {
            describeModel.addTest(null as any);
            expect(describeModel.tests).toEqual([]);
        });
    });

    describe('addHook', () => {
        test('should add hooks of different types', () => {
            describeModel.addHook(HookType.BEFORE_ALL, mockHook);
            describeModel.addHook(HookType.AFTER_ALL, mockHook);
            describeModel.addHook(HookType.BEFORE_EACH, mockHook);
            describeModel.addHook(HookType.AFTER_EACH, mockHook);

            // We can't directly check the hooks array as it's private, but we can test its effects
            // in the run tests
        });

        test('should throw error for invalid hook type', () => {
            expect(() => {
                describeModel.addHook('invalidType' as HookType, mockHook);
            }).toThrow('Invalid hook type: invalidType');
        });
    });

    describe('addDescribe', () => {
        test('should add a nested describe', () => {
            describeModel.addDescribe(mockChildDescribe);
            expect(mockChildDescribe.inheritFromParentDescribe).toHaveBeenCalledWith(describeModel);
        });

        test('should not add a null or undefined describe', () => {
            describeModel.addDescribe(null as any);
            expect(describeModel.tests).toEqual([]);
        });
    });

    describe('inheritFromParentDescribe', () => {
        test('should inherit ancestry from parent', () => {
            const parentDescribe = new DescribeModel('Parent Suite');
            describeModel.inheritFromParentDescribe(parentDescribe);
            expect(describeModel.ancestry).toEqual([ 'Parent Suite' ]);
        });

        test('should inherit skip flag from parent', () => {
            const parentDescribe = new DescribeModel('Parent Suite', { skip: true, only: false });
            describeModel.inheritFromParentDescribe(parentDescribe);
            expect(describeModel.options.skip).toBe(true);
        });

        test('should inherit only flag from parent', () => {
            const parentDescribe = new DescribeModel('Parent Suite', { skip: false, only: true });
            describeModel.inheritFromParentDescribe(parentDescribe);
            expect(describeModel.options.only).toBe(true);
        });
    });

    describe('run', () => {
        test('should emit skip status if skipped', async () => {
            const skippedDescribe = new DescribeModel('Skipped Suite', { skip: true, only: false });
            await skippedDescribe.run(mockContext);

            expect(emitService.emitStatus).toHaveBeenCalledWith(StatusType.SKIP, expect.any(Object));
        });

        test('should run tests and nested describes', async () => {
            // Add test and nested describe
            describeModel.addTest(mockTest);
            describeModel.addDescribe(mockChildDescribe);

            // Add a hook
            describeModel.addHook(HookType.BEFORE_ALL, mockHook);

            await describeModel.run(mockContext);

            // Verify hook was run
            expect(mockHook.run).toHaveBeenCalledWith(mockContext);

            // Verify test was run
            expect(mockTest.run).toHaveBeenCalled();

            // Verify nested describe was run
            expect(mockChildDescribe.run).toHaveBeenCalled();

            // Verify status emissions
            expect(emitService.emitStatus).toHaveBeenCalledWith(StatusType.START, expect.any(Object));
            expect(emitService.emitAction).toHaveBeenCalledWith(ActionType.SUCCESS, expect.any(Object));
        });

        test('should handle and report errors', async () => {
            const error = new Error('Test error');
            mockTest.run.mockRejectedValue(error);

            describeModel.addTest(mockTest);
            await describeModel.run(mockContext);

            expect(emitService.emitAction).toHaveBeenCalledWith(ActionType.FAILURE, expect.objectContaining({
                errors: [ error ]
            }));
        });

        test('should handle afterAll errors', async () => {
            const afterAllError = new Error('afterAll error');
            const spyExecuteHooks: any = jest.spyOn(describeModel, <any> 'executeHooks');
            spyExecuteHooks.mockResolvedValueOnce();
            spyExecuteHooks.mockRejectedValueOnce(afterAllError);

            await describeModel.run(mockContext);

            expect(emitService.emitAction).toHaveBeenCalledWith(ActionType.FAILURE, expect.objectContaining({
                errors: [ afterAllError ]
            }));

            // Verify error arrays reset
            expect(mockContext.beforeAllErrors).toEqual([]);
            expect(mockContext.afterAllErrors).toEqual([]);
        });
    });

    describe('tests getter', () => {
        test('should return tests from this describe and nested describes', () => {
            // Setup child describe with tests
            const childDescribe = new DescribeModel('Child');
            childDescribe.addTest(mockTest);

            // Add tests to parent describe
            describeModel.addTest(mockTest);
            describeModel.addDescribe(childDescribe);

            // We should get 2 tests - 1 from parent, 1 from child
            expect(describeModel.tests.length).toBe(2);
        });
    });
});
