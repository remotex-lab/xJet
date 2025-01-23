/**
 * Import will remove at compile time
 */

import type { DescribeModel } from '@global/models/describe.model';
import type { ContextType, FunctionType } from '@interfaces/function.interface';
import type { TestFlagsType } from '@global/models/interfaces/test-model.interface';
import type { ContextInterface } from '@global/models/interfaces/describe-model.interface';
import type { InvocationLocationInterface } from '@global/components/interfaces/location-component.interface';

/**
 * Imports
 */
import { TimeoutError } from '@global/errors/timeout.error';
import { isPromise } from '@global/components/promise.component';
import { HookType } from '@global/models/constants/describe-model.constants';
import { dispatcherComponent } from '@global/components/dispatcher.component';
import { TestExecutionType } from '@global/models/constants/test-model.constants';
import { StatusType } from '@global/components/constants/dispatcher-component.constants';
import { suiteState } from '@global/states/suite.state';

/**
 * Represents a test model that encapsulates details and execution logic for a single test case.
 *
 * @remarks
 * This class handles the setup, invocation, and completion of a test.
 * It also manages inherited flags, execution of lifecycle hooks (e.g., before/after hooks), and error handling.
 * It can process tests of different types, such as asynchronous, synchronous, and callback-based tests.
 *
 * @since 1.0.0
 */

export class TestModel {
    /**
     * Represents a collection of parents describe names.
     *
     * @remarks
     * This variable stores an array of strings, where each string represents the name of a parent.
     * It can be used in contexts where a list of parent names needs to be managed or processed.
     *
     * @since 1.0.0
     */

    readonly parents: Array<string>;

    /**
     * Represents the location where an invocation occurs.
     * This can either be an instance implementing `InvocationLocationInterface`
     * or `null` if no location information is available.
     *
     * @remarks
     * `InvocationLocationInterface` should define the necessary structure for specifying invocation details.
     * Applications can use this variable
     * to track or log invocation origin.
     *
     * @see InvocationLocationInterface
     *
     * @since 1.0.0
     */

    private location: InvocationLocationInterface | null;

    /**
     * Represents the starting time of an event or process, measured in milliseconds since the Unix epoch.
     *
     * @remarks
     * The `startTime` variable is used to record the starting point of a time-sensitive operation,
     * such as calculating durations or any logic requiring time tracking.
     * It should conform to the standard JavaScript timestamp format (milliseconds since January 1, 1970, 00:00:00 UTC).
     *
     * @since 1.0.0
     */

    private startTime: number;

    /**
     * Constructs an instance of the class with the provided test settings.
     *
     * @param name - The name of the test to be executed.
     * @param testFunction - The function that represents the test logic.
     * @param timeout - The maximum duration (in milliseconds) allowed for the test to run.
     * @param testArgs - An optional parameter representing an array of arguments to be passed to the testFunction.
     * @param testFlags - An optional parameter containing additional flags/settings for the test execution.
     *
     * @remarks
     * This constructor initializes the properties related to the test execution framework.
     * Use it when setting up a single unit of test with specific configuration values.
     *
     * @since 1.0.0
     */

    constructor(
        readonly name: string,
        private readonly testFunction: FunctionType,
        private readonly timeout: number,
        private readonly testArgs: unknown[] = [],
        private readonly testFlags: TestFlagsType = {}
    ) {
        this.parents = [];
        this.location = null;
        this.startTime = 0;
    }

    /**
     * Retrieves the current test flags for the instance.
     *
     * @return The current test flags of type `TestFlagsType`.
     *
     * @remarks
     * This method provides access to the `testFlags` which represents
     * the configuration or state for testing scenarios.
     *
     * @see TestFlagsType
     *
     * @since 1.0.0
     */

    get flags(): TestFlagsType {
        return this.testFlags;
    }

    /**
     * Updates the location information for the current instance.
     *
     * @param location - The location details to set, conforming to `InvocationLocationInterface`,
     * or `null` to clear the current location.

     * @remarks This method is used to update or reset the invocation location data.
     * Ensure the `location` parameter is valid and accurately represents an invocation location.
     *
     * @since 1.0.0
     */

    setLocation(location: InvocationLocationInterface | null): void {
        this.location = location;
    }

    /**
     * Inherits settings and configurations from the provided parent `DescribeModel`.
     *
     * @param parentDescribe - The `DescribeModel` object from which to inherit configurations and flags.
     *
     * @remarks
     * This method applies inheritance logic by calling internal methods to handle flags and parent relationships.
     * Ensure the provided `parentDescribe` object is valid and properly configured.
     *
     * @since 1.0.0
     */

    inheritFromParentDescribe(parentDescribe: DescribeModel): void {
        this.inheritFlags(parentDescribe);
        this.inheritParents(parentDescribe);
    }

    /**
     * Executes the test logic, including hook execution and handling timeouts.
     *
     * @param context - The context object containing the necessary data for the test execution.
     * @param executeHooks - A function to execute hooks such as BEFORE_EACH and AFTER_EACH during the test lifecycle.
     * @param isOnlyMode - An optional parameter to specify if the test should execute in "only mode".
     * Defaults to false.
     *
     * @remarks
     * This method orchestrates the entire lifecycle of a test case, including
     * - Starting the test, executing lifecycle hooks, handling asynchronous operations, managing timeouts,
     * - Dispatching status events based on the test execution result (e.g., success or failure).
     *
     * @since 1.0.0
     */

    async execute(context: ContextType<ContextInterface>, executeHooks: DescribeModel['executeHooks'], isOnlyMode: boolean = false): Promise<void> {
        suiteState.test = this;
        await this.dispatchTestEvent(StatusType.START_TEST);
        if (await this.shouldSkipExecution(context, isOnlyMode)) return;

        // todo fix timeout delay all places
        // use const abortController = new AbortController();

        try {
            this.startTime = Date.now();
            await executeHooks(HookType.BEFORE_EACH, context);

            await Promise.race([
                this.executeTestByType(context),
                new Promise((_, reject) =>
                    setTimeout(() => reject(
                        new TimeoutError(this.timeout, `'${ this.name }' test`, this.location)
                    ), this.timeout)
                )
            ]);

            await executeHooks(HookType.AFTER_EACH, context);
            await this.handlePostExecution();
        } catch (error) {
            await this.dispatchTestEvent(StatusType.FAILURE, error);
        }
    }

    /**
     * Determines whether the execution of a test should be skipped based on given context and flags.
     *
     * @param context - The context object containing state and metadata for the test execution.
     * @param isOnlyMode - A boolean indicating if the test is running in "only" mode.
     *
     * @returns A promise that resolves to a boolean value indicating whether the test execution should be skipped.

     * @remarks
     * This method evaluates multiple conditions such as "todo" flags, "skip" flags, "only" mode,
     * and any errors recorded in `beforeAll` execution phase to decide whether the test should be skipped.
     *
     * @since 1.0.0
     */

    private async shouldSkipExecution(context: ContextType<ContextInterface>, isOnlyMode: boolean): Promise<boolean> {
        if (this.testFlags.todo)
            return await this.dispatchTestEvent(StatusType.TODO) ?? true;

        if (this.testFlags.skip || isOnlyMode)
            return await this.dispatchTestEvent(StatusType.SKIP) ?? true;

        if (context.beforeAllErrors && context.beforeAllErrors.length > 0) {
            return await this.dispatchTestEvent(
                StatusType.FAILURE, context.beforeAllErrors[context.beforeAllErrors.length - 1]
            ) ?? true;
        }

        return false;
    }

    /**
     * Executes a test based on its designated execution type.
     *
     * @param context - The context containing the test execution environment and necessary parameters.
     *
     * @remarks
     * The method determines the execution type (ASYNC, CALLBACK, SYNC) and executes the corresponding test logic accordingly.
     * Each execution type handles the test execution distinctly based on how the test function is defined.
     *
     * @since 1.0.0
     */

    private async executeTestByType(context: ContextType<ContextInterface>): Promise<void> {
        const executionType = this.determineExecutionType();

        switch (executionType) {
            case TestExecutionType.ASYNC:
                await this.testFunction.apply(context, this.testArgs);
                break;
            case TestExecutionType.CALLBACK:
                await this.executeCallbackTest(context);
                break;
            case TestExecutionType.SYNC:
                await this.testFunction.apply(context, this.testArgs);
                break;
        }
    }

    /**
     * Executes a test callback function within a defined execution context.
     *
     * This method wraps the callback execution in a Promise, adding support for both asynchronous
     * and synchronous operations, and ensures proper handling of results or errors.
     *
     * @param context - The execution context in which the test function will be called.
     * @returns A promise that resolves when the callback completes successfully or rejects if an error occurs.
     *
     * @remarks The test function and optional arguments should be defined beforehand as member properties.
     * Ensure the context and any required arguments are passed correctly for seamless operation.
     *
     * @since 1.0.0
     */

    private async executeCallbackTest(context: ContextType<ContextInterface>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const args: Array<unknown> = [
                (error?: string | { message: string }): void => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            ];

            if (this.testArgs.length > 0) {
                args.unshift(...this.testArgs);
            }

            this.testFunction.apply(context, args);
        });
    }

    private async handlePostExecution(): Promise<void> {
        if (this.testFlags.failing) {
            // todo get location
            throw new Error('Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');
        }

        await this.dispatchTestEvent(StatusType.SUCCESS_TEST);
    }

    /**
     * Inherits the parent descriptors from the given `DescribeModel`
     * instance and appends them to the current instance's parent list.
     *
     * @param parentDescribe - The `DescribeModel` instance from which parent descriptors are inherited.
     *
     * @remarks This method mutates the internal parent list of the current instance
     * by appending new parent descriptors derived from the input.
     *
     * @since 1.0.0
     */

    private inheritParents(parentDescribe: DescribeModel): void {
        this.parents.push(...parentDescribe.parents);
        if (parentDescribe.name)
            this.parents.push(parentDescribe.name);
    }

    /**
     * Inherits the `skip` and `only` flags from the parent describe model
     * into the current test flags.
     *
     * @param parentDescribe - The parent DescribeModel instance
     *                          from which the flags are inherited.
     *
     * @remarks This method ensures the current test's flags are properly
     *          overridden by the parent describe model's flags, if applicable.
     *
     * @since 1.0.0
     */

    private inheritFlags(parentDescribe: DescribeModel): void {
        this.testFlags.skip ||= parentDescribe.flags.skip;
        this.testFlags.only ||= parentDescribe.flags.only;
    }

    /**
     * Determines the execution type of the test function.
     *
     * @remarks
     * This method evaluates the nature of the test function to decide whether it runs asynchronously,
     * synchronously, or as a callback.
     * It checks for promise-based functions, callback-style functions,
     * or defaults to synchronous execution.
     *
     * @return The determined execution type of the test function.
     * This can be one of `ASYNC`, `CALLBACK`, or `SYNC` from the `TestExecutionType` enumeration.
     *
     * @since 1.0.0
     */

    private determineExecutionType(): TestExecutionType {
        if (isPromise(this.testFunction)) return TestExecutionType.ASYNC;
        if (this.isCallbackFunction()) return TestExecutionType.CALLBACK;

        return TestExecutionType.SYNC;
    }

    /**
     * Determines if a given function is a callback function by comparing the number of parameters in `testFunction`
     * to the length of `testArgs`.
     *
     * @return Returns `true` if the function is a callback function, otherwise `false`.
     *
     * @remarks
     * A callback function is identified when the number of declared parameters in `testFunction` exceeds
     * the number of provided arguments in `testArgs`.
     *
     * @since 1.0.0
     */

    private isCallbackFunction(): boolean {
        if (this.testFunction.length === 1 && this.testArgs.length === 0) {
            return true;  // Callback: one parameter, no args provided
        } else if (this.testFunction.length === 2) {
            return true;  // Callback: two parameters
        }

        return false;
    }

    /**
     * Calculates the duration in milliseconds from the start time to the current time.
     *
     * @return The duration in milliseconds since the start time.
     * Returns 0 if the start time is not set.
     *
     * @remarks
     * If the `startTime` has not been set (i.e., it equals 0), the method will return 0.
     *
     * @since 1.0.0
     */

    private getDuration(): number {
        if (this.startTime === 0)
            return 0;

        return Date.now() - this.startTime;
    }

    /**
     * Dispatches a test event with the provided status and optional error.
     *
     * @param status - The current status of the test event.
     * @param error - An optional error object or value associated with the test event.
     * @returns A Promise that resolves when the event dispatching is complete.
     *
     * @remarks This method sends the event details such as status, error, duration, name,
     * and parent information to the dispatcher component for further handling.
     *
     * @since 1.0.0
     */

    private async dispatchTestEvent(status: StatusType, error?: unknown): Promise<void> {
        dispatcherComponent({
            error,
            status,
            parents: this.parents,
            duration: this.getDuration(),
            description: this.name
        });
    }
}
