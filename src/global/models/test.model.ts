/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { TestFlags } from '@global/models/interfaces/test-model.interface';

/**
 * Imports
 */

import { isPromise } from '@global/components/promise.component';
import { TestEventType, TestExecutionType } from '@global/models/constants/test.constants';

/**
 * Represents a test model that encapsulates information and execution logic for a test case.
 * Provides support for various test execution types, including async, callback-based, and synchronous.
 */

export class TestModel {
    /**
     * Represents a textual description or information.
     */

    readonly description: string;

    /**
     * Constructs a new instance of the test case.
     *
     * @param description - A brief description of the test case.
     * @param testFunction - The function to be executed for the test case.
     * @param timeout - The maximum time, in milliseconds, allowed for the test function to execute.
     * @param testArgs - An array of arguments to be passed to the test function (optional).
     * @param testFlags - An object containing additional flags or metadata related to the test (optional).
     * @param testParents - A list of parent test names or identifiers that relate to this test (optional).
     *
     * @throws Error Throws an error if the description or testFunction is invalid.
     *
     * @remarks This constructor is primarily used for defining and initializing a test case with relevant details.
     *
     * @since 1.0.0
     */

    constructor(
        description: string,
        private readonly testFunction: FunctionType,
        private readonly timeout: number,
        private readonly testArgs: unknown[] = [],
        private readonly testFlags: TestFlags = {},
        private readonly testParents: string[] = []
    ) {
        this.description = description;
    }

    /**
     * Executes the test function by determining whether it should skip execution,
     * running the test logic, and handling post-execution activities. It also includes
     * a timeout mechanism to prevent the execution from running indefinitely.
     *
     * @param context - A context object that can be passed to the test execution logic.
     * It defaults to an empty object.
     * @param isOnlyMode - A flag indicating whether the test should run in an "only" mode.
     * Defaults to `false`.
     * @returns A Promise that resolves when the test execution and post-execution
     * activities are completed.
     *
     * @remarks The `execute` method wraps the testing logic with error handling and
     * a timeout mechanism, ensuring the test does not hang indefinitely.
     *
     * @since 1.0.0
     */

    async execute(context: ThisType<unknown> = {}, isOnlyMode = false): Promise<void> {
        if (await this.shouldSkipExecution(isOnlyMode)) return;
        const startTime = Date.now();

        try {
            await Promise.race([
                this.executeTestByType(context),
                new Promise((_, reject) =>
                    setTimeout(() => reject(
                        // todo Error point to test function
                        new Error('Test timeout exceeded')
                    ), this.timeout)
                )
            ]);

            await this.handlePostExecution(startTime);
        } catch (error) {
            console.log(this.testFunction.toString());
            console.log('error', error, this.getDuration(startTime));
        }
    }

    /**
     * Handles the post-execution logic of a test, including determining the test outcome
     * and dispatching the appropriate event based on the test status.
     *
     * @param startTime - The starting time of the test execution in milliseconds since epoch.
     * @returns A `Promise<boolean>` resolving to `true` for successful event dispatches.
     *
     * @remarks This method calculates the test duration and determines if the test has passed or failed
     * based on specific flags. It handles the dispatch of corresponding test events.
     *
     * @since 1.0.0
     */

    private async handlePostExecution(startTime: number): Promise<boolean> {
        const duration = this.getDuration(startTime);
        if (this.testFlags.failing) {
            const error = new Error( 'Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');

            return await this.dispatchTestEvent(TestEventType.FAILURE,{
                stack: error.stack,
                message: error.message
            });
        }

        return await this.dispatchTestEvent(TestEventType.SUCCESS, {
            duration,
            parents: this.testParents,
            description: this.description
        });
    }

    /**
     * Executes a test based on the determined execution type.
     *
     * @param context - The context in which the test function should be executed.
     *
     * @throws Error Throws an error if an unknown `TestExecutionType` is encountered.
     *
     * @remarks
     * The method determines the execution type of the test (ASYNC, CALLBACK, SYNC)
     * and executes the corresponding logic. The test function is invoked with
     * the provided context and arguments.
     *
     * @since 1.0.0
     */

    private async executeTestByType(context: ThisType<unknown>): Promise<void> {
        const executionType = this.determineExecutionType();

        switch (executionType) {
            case TestExecutionType.ASYNC:
                await this.testFunction.apply(context, this.testArgs);
                break;
            case TestExecutionType.CALLBACK:
                await this.executeCallbackTest(context);
                break;
            case TestExecutionType.SYNC:
                this.testFunction.apply(context, this.testArgs);
                break;
        }
    }

    /**
     * Executes a test function with the specified context and arguments, handling the completion
     * through a callback function. Resolves when the callback signifies success and rejects when
     * an error is passed to the callback.
     *
     * @param context - The context in which the `testFunction` should be executed.
     * @return A promise that resolves when the callback has been executed without error or rejects
     *         if an error is passed to the callback.
     *
     * @remarks This method is designed to work with callback-based functions in an asynchronous manner,
     *          converting them to a Promise-based structure for compatibility with async/await syntax.
     * @since 1.0.0
     */

    private async executeCallbackTest(context: ThisType<unknown>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.testFunction.apply(context, [
                this.testArgs,
                (error?: string | { message: string }) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            ]);
        });
    }

    /**
     * Determines whether the execution of a test should be skipped based on specific conditions.
     *
     * @param isOnlyMode - A boolean flag that indicates if the test is in "only" mode.
     *
     * @returns A promise that resolves to `true` if the test should be skipped, and `false` otherwise.
     *
     * @remarks
     * The method evaluates whether the test should be skipped or marked as "todo" based on current test flags.
     * To skip execution, the method dispatches corresponding test events for "TODO" or "SKIP".
     *
     * @since 1.0.0
     */

    private async shouldSkipExecution(isOnlyMode: boolean): Promise<boolean> {
        if (this.testFlags.todo) {
            return await this.dispatchTestEvent(TestEventType.TODO);
        }

        if (this.testFlags.skip || isOnlyMode) {
            return await this.dispatchTestEvent(TestEventType.SKIP);
        }

        return false;
    }

    /**
     * Determines the execution type of `test` function by inspecting its properties.
     *
     * @return The determined `TestExecutionType` of the test function.
     *
     * @throws Error if the test function cannot be classified into any known execution type.
     *
     * @remarks
     * This method checks whether the test function is a promise, uses a callback,
     * or is synchronous and determines the appropriate execution type accordingly.
     *
     * @since 1.0.0
     */

    private determineExecutionType(): TestExecutionType {
        if (isPromise(this.testFunction)) return TestExecutionType.ASYNC;
        if (this.isCallbackFunction()) return TestExecutionType.CALLBACK;

        return TestExecutionType.SYNC;
    }

    /**
     * Determines if the current function is being used as a callback function
     *
     * @returns A boolean value: `true` if the function meets the criteria for a callback, otherwise `false`.
     *
     * @throws This method does not explicitly throw exceptions but relies on the integrity of `testFunction` and `testArgs` properties.
     *
     * @remarks
     * A function qualifies as a callback function if it either has more than
     * one parameter or if there are no additional arguments provided.
     *
     * @since 1.0.0
     */

    private isCallbackFunction(): boolean {
        return this.testFunction.length > 1 || this.testArgs.length === 0;
    }

    /**
     * Calculates the duration in milliseconds from the provided start time to the current time.
     *
     * @param startTime - The starting point in time as a timestamp (in milliseconds).
     * @returns The duration, in milliseconds, from the provided start time to the current time.
     *
     * @throws Throws an error if the provided `startTime` is not a valid number or is in the future.
     *
     * @remarks Ensure the `startTime` is a valid timestamp from the past to avoid errors.
     *
     * @since 1.0.0
     */

    private getDuration(startTime: number): number {
        return Date.now() - startTime;
    }

    /**
     * Dispatches a test event of the specified type and optionally logs an error.
     * @since 1.0.0
     */

    // todo Error
    private async dispatchTestEvent(eventType: TestEventType, error?: any): Promise<true> {
        console.log(eventType, error);

        return true;
    }
}
