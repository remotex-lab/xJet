/**
 * Import will remove at compile time
 */

import type { FlagsInterface } from '@models/interfaces/models.interface';
import type { ArgsVoidCallback, AsyncVoidCallback, CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Imports
 */

import { SuiteState } from '@states/suite.state';
import { isPromise } from '@components/promise.component';
import { TestEventType, TestMode } from '@const/test.const';
import { dispatch } from '@components/dispatch.component';

/**
 * Represents a test case model in the testing framework.
 * It includes the test name, mode, parent describes, test function, and execution flags.
 */


export class TestModel {
    /**
     * Test duration in ms
     */

    duration: number = 0;

    /**
     * The name of the test case.
     */

    readonly name: string;

    /**
     * The mode of the test case, which determines how it should be executed.
     *
     * @options TO-DO, FAILING, DEFAULT
     */

    readonly mode: TestMode;

    /**
     * An array of parent describes, representing the nested describe blocks this test case belongs to.
     */

    readonly parents: Array<string>;

    /**
     * The flags associated with the test case, such as `skip` or `only`.
     */

    private readonly flags: FlagsInterface;

    /**
     * The function representing the test case logic. It can accept arguments or a callback.
     */

    private readonly blockFn: ArgsVoidCallback | CallbackHandler;

    /**
     * Creates an instance of TestModel.
     *
     * @param name - The name of the test case.
     * @param blockFn - The function representing the test case logic.
     * @param mode - The mode of the test case. Default is TestMode.DEFAULT.
     * @param flags - The flags associated with the test case. Default is an empty object.
     * @param parents - The parent describes of the test case. Default is an empty array.
     */

    constructor(name: string, blockFn: ArgsVoidCallback | CallbackHandler, mode = TestMode.DEFAULT, flags: FlagsInterface = {}, parents: Array<string> = []) {
        this.name = name;
        this.mode = mode;
        this.flags = flags;
        this.blockFn = blockFn;
        this.parents = parents;
    }

    /**
     * Updates the flags of the test case with flags from a parent describe block.
     * If a flag is already set in the current test case, it will not be overwritten.
     *
     * @param flags - The new flags inherited from the parent describe block.
     *                If a flag is truthy and not already set in the current test case,
     *                it will be added to the current test case flags.
     */

    inheritFromParentDescribe(flags: FlagsInterface): void {
        Object.entries(flags).forEach(([ key, value ]) => {
            if (value) {
                this.flags[key as keyof FlagsInterface] ||= value;
            }
        });
    }

    /**
     * Executes the test case, handling different modes, flags, and test execution paths.
     *
     * @param testContext - The context to be used during test execution.
     * @returns A promise that resolves when the test case execution is complete.
     */

    async exec(testContext: unknown): Promise<void> {
        await this.dispatchTestEvent(TestEventType.START);
        const startTime = Date.now();

        if (this.mode === TestMode.TODO) {
            return await this.dispatchTestEvent(TestEventType.TODO);
        }

        if (this.flags.skip || (SuiteState.getInstance().isOnlyMode && !this.flags.only)) {
            return await this.dispatchTestEvent(TestEventType.SKIP);
        }

        try {
            await this.runTestBlock(testContext);
            await this.handlePostExecution(startTime);
        } catch (error) {
            await this.handleExecutionError(startTime, <Error> error);
        }
    }

    /**
     * Dispatches a test event to the eclipse service.
     *
     * @param eventType - The type of the test event to be dispatched.
     * @param error - An optional error object to include in the event, providing context for failure events.
     * @returns A promise that resolves when the event dispatch is complete.
     *
     * @remarks
     * This method is responsible for communicating the outcome of a test case to the eclipse service.
     * The `eventType` parameter specifies the nature of the event (e.g., START, SKIP, TODO, SUCCESS, FAILURE).
     * The optional `error` parameter allows for passing an error object in the case of a test failure,
     * providing additional context for the failure.
     */

    // Todo error
    private async dispatchTestEvent(eventType: TestEventType, error?: any): Promise<void> {
        return dispatch({
            type: eventType,
            test: this,
            error
        });
    }

    /**
     * Runs the test block function.
     *
     * @param testContext - The context to be used during test execution.
     * @returns A promise that resolves when the test block execution is complete.
     */

    private async runTestBlock(testContext: unknown): Promise<void> {
        if (isPromise(this.blockFn)) {
            await (<AsyncVoidCallback> this.blockFn).call(testContext);
        } else if (this.blockFn.length > 0) {
            await new Promise<void>((resolve) => {
                (<ArgsVoidCallback> this.blockFn).call(testContext, () => resolve());
            });
        } else {
            (<ArgsVoidCallback> this.blockFn).call(testContext);
        }
    }

    /**
     * Handles post-execution tasks for a successful test run.
     *
     * @param startTime - The timestamp when the test execution started.
     * @returns A promise that resolves when post-execution tasks are complete.
     */

    private async handlePostExecution(startTime: number): Promise<void> {
        this.setDuration(startTime);
        if (this.mode === TestMode.FAILING) {
            const error = new Error( 'Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');

            return await this.dispatchTestEvent(TestEventType.FAILURE,{
                stack: error.stack,
                message: error.message
            });
        }

        await this.dispatchTestEvent(TestEventType.SUCCESS);
    }

    /**
     * Handles post-execution tasks for a failed test run.
     *
     * @param startTime - The timestamp when the test execution started.
     * @param error - The error encountered during test execution.
     * @returns A promise that resolves when post-execution tasks are complete.
     */

    private async handleExecutionError(startTime: number, error: Error): Promise<void> {
        this.setDuration(startTime);
        if (this.mode === TestMode.FAILING) {
            await this.dispatchTestEvent(TestEventType.SUCCESS);
        } else {
            await this.dispatchTestEvent(TestEventType.FAILURE, {
                stack: error.stack,
                message: error.message
            });
        }
    }


    /**
     * Sets the duration of the test execution.
     *
     * @param startTime - The timestamp when the test execution started.
     */

    private setDuration(startTime: number): void {
        this.duration = Date.now() - startTime;
    }
}
