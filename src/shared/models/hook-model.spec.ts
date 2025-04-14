/**
 * Import will remove at compile time
 */

import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { HookModel } from '@shared/models/hook.model';
import { TimeoutError } from '@shared/errors/timeout.error';

/**
 * Mock dependencies
 */

jest.mock('@components/promise.component', () => ({
    isPromise: jest.fn((fn) => fn.constructor.name === 'AsyncFunction')
}));

/**
 * Tests
 */

describe('HookModel', () => {
    const mockLocation: InvocationLocationInterface = {
        line: 42,
        column: 42
    };

    const defaultTimeout = 1000;

    describe('constructor', () => {
        test('should create an instance with the provided hook function and timeout', () => {
            const hookFn = jest.fn();
            const hookModel = new HookModel(hookFn, defaultTimeout);

            expect(hookModel).toBeInstanceOf(HookModel);
        });
    });

    describe('setLocation', () => {
        test('should set location correctly', () => {
            const hookFn = jest.fn();
            const hookModel = new HookModel(hookFn, defaultTimeout);

            hookModel.setLocation(mockLocation);

            // Test internal state indirectly through behavior
            const context = {};

            // Create a timeout to trigger the error with location
            jest.useFakeTimers();
            const executePromise = hookModel.run(context);

            jest.advanceTimersByTime(defaultTimeout + 100);

            return executePromise.catch(error => {
                expect(error).toBeInstanceOf(TimeoutError);
            }).finally(() => {
                jest.useRealTimers();
            });
        });

        test('should clear location when undefined is provided', () => {
            const hookFn = jest.fn();
            const hookModel = new HookModel(hookFn, defaultTimeout);

            hookModel.setLocation(mockLocation);
            hookModel.setLocation(undefined);

            // Test by checking the timeout error doesn't have location
            jest.useFakeTimers();
            const executePromise = hookModel.run({});

            jest.advanceTimersByTime(defaultTimeout + 100);

            return executePromise.catch(error => {
                expect(error).toBeInstanceOf(TimeoutError);
                expect(error.location).toBeUndefined();
            }).finally(() => {
                jest.useRealTimers();
            });
        });
    });

    describe('execute', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        test('should execute synchronous hook function successfully', async () => {
            const hookFn = jest.fn();
            const hookModel = new HookModel(hookFn, defaultTimeout);
            const context = { data: 'test' };

            await hookModel.run(context);

            expect(hookFn).toHaveBeenCalledTimes(1);
            expect(hookFn.mock.instances[0]).toBe(context);
        });

        test('should execute callback-based hook function successfully', async () => {
            const hookFn = jest.fn((done) => {
                setTimeout(() => done(), 100);
            });
            // Make Jest recognize this as a function with arguments
            Object.defineProperty(hookFn, 'length', { value: 1 });

            const hookModel = new HookModel(hookFn, defaultTimeout);
            const context = { data: 'test' };

            jest.useFakeTimers();
            const executePromise = hookModel.run(context);

            // Advance timers to trigger the callback
            jest.advanceTimersByTime(100);

            await executePromise;

            expect(hookFn).toHaveBeenCalledTimes(1);
            expect(hookFn.mock.instances[0]).toBe(context);
        });

        test('should execute async hook function successfully', async () => {
            const hookFn: any = jest.fn(async () => {
                return new Promise(resolve => setTimeout(resolve, 100));
            });

            const asyncHookModel = new HookModel(hookFn, defaultTimeout);
            const context = { data: 'test' };

            jest.useFakeTimers();
            const executePromise = asyncHookModel.run(context);

            // Advance timers to let the Promise resolve
            jest.advanceTimersByTime(100);

            await executePromise;

            expect(hookFn).toHaveBeenCalledTimes(1);
            expect(hookFn.mock.instances[0]).toBe(context);
        });

        test('should throw TimeoutError when hook function exceeds timeout', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const hookFn = jest.fn((done) => {
                // This never calls done()
            });

            // Make Jest recognize this as a function with arguments
            Object.defineProperty(hookFn, 'length', { value: 1 });

            const hookModel = new HookModel(hookFn, defaultTimeout);
            const context = { data: 'test' };

            jest.useFakeTimers();
            const executePromise = hookModel.run(context);

            jest.advanceTimersByTime(defaultTimeout + 100);

            await expect(executePromise).rejects.toThrow(TimeoutError);
            expect(hookFn).toHaveBeenCalledTimes(1);
        });

        test('should throw error when async hook incorrectly uses done callback', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const asyncHookWithCallback: any = async function(done: () => void) {
                // This is wrong - async function shouldn't use callbacks
            };
            // Make Jest recognize this as a function with arguments
            Object.defineProperty(asyncHookWithCallback, 'length', { value: 1 });

            const hookModel = new HookModel(asyncHookWithCallback, defaultTimeout);

            await expect(hookModel.run({})).rejects.toThrow('Async hook');
        });

        test('should propagate errors from callback-based hooks', async () => {
            const errorMessage = 'Test error from callback';
            const hookFn = jest.fn((done) => {
                setTimeout(() => done(errorMessage), 100);
            });
            // Make Jest recognize this as a function with arguments
            Object.defineProperty(hookFn, 'length', { value: 1 });

            const hookModel = new HookModel(hookFn, defaultTimeout);

            jest.useFakeTimers();
            const executePromise = hookModel.run({});

            jest.advanceTimersByTime(100);

            await expect(executePromise).rejects.toBe(errorMessage);
        });

        test('should clean up timeout after successful execution', async () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
            const hookFn = jest.fn();
            const hookModel = new HookModel(hookFn, defaultTimeout);

            await hookModel.run({});

            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });
    });
});
