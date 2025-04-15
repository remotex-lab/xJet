/**
 * Imports
 */

import {
    createHook,
    afterAllDirective,
    afterEachDirective,
    beforeAllDirective,
    beforeEachDirective
} from '@shared/directives/hook.directive';
import { HookModel } from '@shared/models/hook.model';
import { SuiteState } from '@shared/states/suite.state';
import { HookType } from '@shared/models/constants/hook.model.constants';
import { getInvocationLocation } from '@shared/components/location.component';

/**
 * Mock dependencies
 */

jest.mock('@shared/models/hook.model');
jest.mock('@shared/states/suite.state');
jest.mock('@shared/components/location.component');

/**
 * Tests
 */

describe('Hook Directives', () => {
    let mockSuiteInstance: { describe: { addHook: jest.Mock } };
    let mockHookModelInstance: any;

    beforeEach(() => {
        mockSuiteInstance = {
            describe: {
                addHook: jest.fn()
            }
        };

        mockHookModelInstance = {
            setLocation: jest.fn()
        };

        (HookModel as jest.Mock).mockImplementation(() => mockHookModelInstance);
        jest.spyOn(SuiteState, 'getInstance').mockReturnValue(<any> mockSuiteInstance);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createHook', () => {
        test('should create a hook model with provided callback and timeout', () => {
            const mockCallback = jest.fn();
            const timeout = 7000;

            createHook(HookType.BEFORE_EACH, mockCallback, undefined, timeout);
            expect(HookModel).toBeCalledWith(mockCallback, timeout);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_EACH,
                mockHookModelInstance
            );
        });

        test('should use default timeout value when not provided', () => {
            const mockCallback = jest.fn();

            createHook(HookType.BEFORE_EACH, mockCallback);
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_EACH,
                mockHookModelInstance
            );
        });

        test('should add the hook to the current suite state', () => {
            const mockCallback = jest.fn();
            const hookType = HookType.AFTER_ALL;

            createHook(hookType, mockCallback);
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.AFTER_ALL,
                mockHookModelInstance
            );
        });
    });

    describe('afterAllDirective', () => {
        test('should call createHook with AFTER_ALL hook type', () => {
            const mockCallback = jest.fn();
            const timeout = 8000;

            afterAllDirective(mockCallback, timeout);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, timeout);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.AFTER_ALL,
                mockHookModelInstance
            );
        });

        test('should use default timeout when not provided', () => {
            const mockCallback = jest.fn();

            afterAllDirective(mockCallback);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.AFTER_ALL,
                mockHookModelInstance
            );
        });
    });

    describe('beforeAllDirective', () => {
        test('should call createHook with BEFORE_ALL hook type', () => {
            const mockCallback = jest.fn();
            const timeout = 9000;

            beforeAllDirective(mockCallback, timeout);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, timeout);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_ALL,
                mockHookModelInstance
            );
        });

        test('should use default timeout when not provided', () => {
            const mockCallback = jest.fn();

            beforeAllDirective(mockCallback);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_ALL,
                mockHookModelInstance
            );
        });
    });

    describe('afterEachDirective', () => {
        test('should call createHook with AFTER_EACH hook type', () => {
            const mockCallback = jest.fn();
            const timeout = 7500;

            afterEachDirective(mockCallback, timeout);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, timeout);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.AFTER_EACH,
                mockHookModelInstance
            );
        });

        test('should use default timeout when not provided', () => {
            const mockCallback = jest.fn();

            afterEachDirective(mockCallback);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.AFTER_EACH,
                mockHookModelInstance
            );
        });
    });

    describe('beforeEachDirective', () => {
        test('should call createHook with BEFORE_EACH hook type', () => {
            const mockCallback = jest.fn();
            const timeout = 6000;

            beforeEachDirective(mockCallback, timeout);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, timeout);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_EACH,
                mockHookModelInstance
            );
        });

        test('should use default timeout when not provided', () => {
            const mockCallback = jest.fn();

            beforeEachDirective(mockCallback);
            expect(getInvocationLocation).toBeCalled();
            expect(HookModel).toBeCalledWith(mockCallback, 5000);
            expect(mockHookModelInstance.setLocation).toHaveBeenCalled();
            expect(mockSuiteInstance.describe.addHook).toHaveBeenCalledWith(
                HookType.BEFORE_EACH,
                mockHookModelInstance
            );
        });
    });
});
