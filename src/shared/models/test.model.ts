/**
 * Import will remove at compile time
 */

import type { TestFlagsType } from '@shared/models/interfaces/test-model.interface';
import type { ContextInterface } from '@shared/models/interfaces/describe-model.interface';
import type { ContextType, FunctionLikeType, FunctionType } from '@interfaces/function.interface';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';
import type { EmitActionEventType, EmitStatusEventType } from '@shared/services/interfaces/emit-service.interface';

/**
 * Imports
 */

import { SuiteState } from '@shared/states/suite.state';
import { isPromise } from '@components/promise.component';
import { FailingError } from '@shared/errors/failing.error';
import { withTimeout } from '@shared/components/timeout.component';
import { emitAction, emitStatus } from '@shared/services/emit.service';
import { HookType } from '@shared/models/constants/hook.model.constants';
import { TestExecutionType } from '@shared/models/constants/test-model.constants';
import { ActionType, KindType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Represents a test case within the testing framework that manages execution,
 * timing, and reporting of individual tests.
 *
 * @example
 * ```ts
 * const test = new TestModel(
 *   'should validate user input correctly',
 *   async () => {
 *     const result = await validateInput('test@example.com');
 *     expect(result.isValid).toBe(true);
 *   },
 *   2000
 * );
 *
 * // Set ancestry to show the test's location in the test hierarchy
 * test.ancestry = ['Authentication', 'Input Validation'];
 *
 * // Execute the test
 * await test.execute();
 * ```
 *
 * @remarks
 * The TestModel is responsible for tracking test execution time, handling timeouts,
 * managing test context, and reporting test status through the emit service.
 * It supports both synchronous and promise-based test implementations.
 *
 * @throws FailingError - When a test fails due to assertions or errors
 *
 * @see ContextInterface
 * @see EmitActionEventType
 * @see EmitStatusEventType
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

export class TestModel {
    /**
     * Stores the hierarchical path of parent test descriptions that contain this test
     *
     * @default []
     * @since 1.0.0
     */

    readonly ancestry: Array<string> = [];

    /**
     * Stores information about where this test is being executed in the source code
     *
     * @see InvocationLocationInterface
     * @since 1.0.0
     */

    private executionLocation?: InvocationLocationInterface;

    /**
     * Timestamp when test execution started, measured in milliseconds
     *
     * @default 0
     * @since 1.0.0
     */

    private executionStartTime: number = 0;

    /**
     * Creates a new instance of the TestModel to represent an executable test.
     *
     * @param description - The test description that explains the purpose of the test
     * @param testImplementation - The function containing the actual test code to be executed
     * @param timeoutDuration - The maximum time in milliseconds that the test is allowed to run
     * @param testParameters - An array of parameters to be passed to the test implementation
     * @param testOptions - Configuration options that control test execution behavior
     *
     * @example
     * ```ts
     * const test = new TestModel(
     *   'should calculate the correct sum',
     *   () => expect(sum(2, 2)).toBe(4),
     *   5000
     * );
     * ```
     *
     * @since 1.0.0
     */

    constructor(
        readonly description: string,
        private readonly testImplementation: FunctionType,
        private readonly timeoutDuration: number,
        private readonly testParameters: unknown[] = [],
        private readonly testOptions: TestFlagsType = {}
    ) {}

    /**
     * Provides access to the test configuration options.
     *
     * @returns The test configuration options that control test execution behavior
     *
     * @since 1.0.0
     */

    get options(): TestFlagsType {
        return this.testOptions;
    }

    /**
     * Sets the location where the test is being executed.
     *
     * @param location - The execution location information containing position details
     *
     * @see InvocationLocationInterface
     * @since 1.0.0
     */

    setExecutionLocation(location: InvocationLocationInterface): void {
        this.executionLocation = location;
    }

    /**
     * Applies execution control options to the test, allowing it to be skipped or run exclusively.
     *
     * @param skip - Flag indicating whether the test should be skipped during execution
     * @param only - Flag indicating whether only this test should be executed
     *
     * @remarks
     * This method uses logical OR assignment (||=) to ensure options are only set to true and
     * never reset from true to false. Existing flag values take precedence.
     *
     * @example
     * ```ts
     * testInstance.applyExecutionFlags(true, false); // Will mark test to be skipped
     * testInstance.applyExecutionFlags(false, true); // Will mark test to run exclusively
     * ```
     *
     * @see TestFlagsType
     * @since 1.0.0
     */

    applyExecutionFlags(skip?: boolean, only?: boolean): void {
        this.testOptions.skip ||= skip;
        this.testOptions.only ||= only;
    }

    /**
     * Sets the ancestry for this test by adding parent test descriptions to the ancestry chain.
     *
     * @param parentTests - Array of parent test description strings representing the test hierarchy
     *
     * @example
     * ```ts
     * const childTest = new TestModel("should work", () => {}, 5000);
     * childTest.setAncestry(["describe block A", "describe block B"]);
     * ```
     *
     * @since 1.0.0
     */

    setAncestry(parentTests: string[]): void {
        this.ancestry.push(...parentTests);
    }

    /**
     * Executes the test within the specified context, managing test lifecycle and status reporting.
     *
     * @param context - The test execution context containing shared state and utilities
     * @param runLifecycleHooks - Function that runs before/after hooks at appropriate times
     * @param isExclusiveMode - Flag indicating if tests are running in exclusive mode (only marked tests)
     * @returns Promise that resolves when the test execution completes
     *
     * @throws Error - If any unhandled exceptions occur during test execution that aren't captured
     *
     * @remarks
     * The method tracks execution time, manages test lifecycle, handles skipping logic, and processes
     * test results. It also notifies about test status changes through observer pattern implementation.
     *
     * @example
     * ```ts
     * // Running a test with context and lifecycle hooks
     * await testInstance.run(
     *   testContext,
     *   async (hookType, ctx) => {
     *     await runHooks(hookType, ctx);
     *   },
     *   false
     * );
     * ```
     *
     * @see HookType
     * @see ActionType
     * @see ContextInterface
     *
     * @since 1.0.0
     */

    async run(
        context: ContextType<ContextInterface>,
        runLifecycleHooks: FunctionLikeType<Promise<void>, [ HookType, ContextType<ContextInterface> ]>,
        isExclusiveMode: boolean = false
    ): Promise<void> {
        SuiteState.getInstance().test = this;
        this.executionStartTime = Date.now();
        this.notifyTestStatus(StatusType.START);

        if (this.shouldSkipDueToSetupErrors(context))
            return;

        const skipAction = this.determineSkipAction(isExclusiveMode);
        if (skipAction)
            return this.notifyTestStatus(skipAction);

        try {
            await this.executeTestWithLifecycle(context, runLifecycleHooks);
            this.validateTestOutcome();
        } catch (error) {
            this.notifyTestFailure(error);
        } finally {
            SuiteState.getInstance().test = undefined;
        }
    }

    /**
     * Determines whether a test should be skipped due to errors in setup hooks.
     *
     * @param context - The test execution context containing shared state and potential setup errors
     * @returns Boolean indicating whether the test should be skipped
     *
     * @remarks
     * This method checks if any errors occurred in beforeAll hooks and reports them as test failures.
     * Tests are skipped when setup errors are present to prevent misleading test results.
     *
     * @see ContextInterface
     *
     * @internal
     *
     * @since 1.0.0
     */

    private shouldSkipDueToSetupErrors(context: ContextType<ContextInterface>): boolean {
        if (context.beforeAllErrors && context.beforeAllErrors.length > 0) {
            this.notifyTestFailure(context.beforeAllErrors as Array<unknown>);

            return true;
        }

        return false;
    }

    /**
     * Determines if a test should be skipped and returns the appropriate action type.
     *
     * @param isExclusiveMode - Flag indicating if tests are running in exclusive mode
     * @returns The specific action type if the test should be skipped, or null if the test should run
     *
     * @remarks
     * This method evaluates test options and the execution mode to determine whether a test
     * should be skipped and how it should be reported. It handles to-do tests, explicitly skipped tests,
     * and tests that should be skipped due to exclusive mode.
     *
     * @internal
     * @see ActionType
     * @see EmitStatusEventType
     *
     * @since 1.0.0
     */

    private determineSkipAction(isExclusiveMode: boolean): EmitStatusEventType | null {
        if(SuiteState.getInstance().isOnlyMode && !this.testOptions.only) {
            return StatusType.SKIP;
        }

        if (this.testOptions.todo) return StatusType.TODO;
        if (this.testOptions.skip) return StatusType.SKIP;
        if (isExclusiveMode && !this.testOptions.only) return StatusType.SKIP;

        return null;
    }

    /**
     * Executes a test with proper lifecycle hooks and timeout management.
     *
     * @param context - The test execution context containing shared state and utilities
     * @param runLifecycleHooks - Function that runs the specified hook type with the given context
     *
     * @returns Promise that resolves when the test and all its lifecycle hooks have completed
     *
     * @throws TimeoutError - When the test execution exceeds the configured timeout duration
     *
     * @remarks
     * This method orchestrates the complete test execution flow including:
     * 1. Running beforeEach hooks
     * 2. Executing the actual test body with timeout protection
     * 3. Running afterEach hooks regardless of test outcome
     *
     * @internal
     * @see HookType
     * @see ContextInterface
     * @see withTimeout
     *
     * @since 1.0.0
     */

    private async executeTestWithLifecycle(
        context: ContextType<ContextInterface>,
        runLifecycleHooks: FunctionLikeType<Promise<void>, [ HookType, ContextType<ContextInterface> ]>
    ): Promise<void> {
        await runLifecycleHooks(HookType.BEFORE_EACH, context);

        await withTimeout<void>(
            async () => this.executeTestWithContext(context),
            this.timeoutDuration,
            `'${ this.timeoutDuration }' test`
        );

        await runLifecycleHooks(HookType.AFTER_EACH, context);
    }

    /**
     * Validates the test outcome, handling failing tests and notifying of success.
     *
     * @throws FailingError - When a test is marked as failing but successfully completes
     *
     * @remarks
     * This method implements special handling for tests marked with the 'failing' option.
     * For failing tests, it throws an error if the test unexpectedly succeeds.
     * For normal tests, it reports a successful test outcome.
     *
     * @internal
     * @see ActionType
     * @see FailingError
     *
     * @since 1.0.0
     */

    private validateTestOutcome(): void {
        if (this.testOptions.failing) {
            throw new FailingError();
        }

        this.notifyTestAction(ActionType.SUCCESS);
    }

    /**
     * Determines if the test is using callback-style asynchronous execution.
     *
     * @returns Boolean indicating whether the test uses the callback pattern
     *
     * @remarks
     * This method analyzes the test implementation's parameter count to detect callback-style tests.
     * It identifies two callback patterns:
     * 1. A test function that expects exactly one parameter (the callback) with no test parameters
     * 2. A test function that expects exactly two parameters (test arguments and callback)
     *
     * The callback pattern is an alternative to Promise-based async tests.
     *
     * @internal
     * @since 1.0.0
     */

    private isCallbackStyle(): boolean {
        // Callback style if function expects exactly one callback parameter with no args
        if (this.testImplementation.length === 1 && this.testParameters.length === 0)
            return true;

        // Or if it expects more parameters (test args + callback)
        return this.testImplementation.length === 2;
    }

    private getExecutionStrategy(): TestExecutionType {
        if (isPromise(this.testImplementation)) return TestExecutionType.ASYNC;
        if (this.isCallbackStyle()) return TestExecutionType.CALLBACK;

        return TestExecutionType.SYNC;
    }

    /**
     * Executes the test function with the appropriate execution strategy based on its type.
     *
     * @param context - The test execution context containing shared state and utilities
     *
     * @returns Promise that resolves when the test execution completes
     *
     * @throws Error - When the test execution fails for any reason
     *
     * @remarks
     * This method determines and applies the correct execution strategy for the test:
     * - For synchronous and async tests, it calls the test implementation directly with the context
     * - For callback-style tests, it delegates to a specialized execution method
     * The method ensures proper 'this' binding by using Function.prototype.apply
     *
     * @internal
     * @see ContextInterface
     * @see TestExecutionType
     *
     * @since 1.0.0
     */

    private async executeTestWithContext(context: ContextType<ContextInterface>): Promise<void> {
        const strategy = this.getExecutionStrategy();

        switch (strategy) {
            case TestExecutionType.ASYNC:
            case TestExecutionType.SYNC:
                await this.testImplementation.apply(context, this.testParameters);
                break;
            case TestExecutionType.CALLBACK:
                await this.executeCallbackStyleTest(context);
                break;
        }
    }

    /**
     * Executes a callback-style test by wrapping it in a Promise.
     *
     * @param context - The test execution context containing shared state and utilities
     *
     * @returns Promise that resolves when the callback is invoked without an error, or rejects when called with an error
     *
     * @throws Error - When the callback is invoked with an error parameter
     *
     * @remarks
     * This method adapts callback-style test functions to work within a Promise-based execution flow.
     * It creates a Promise wrapper around the test function and:
     * 1. Defines a callback function that resolves/rejects the Promise based on error parameter
     * 2. Appends this callback to the original test parameters
     * 3. Invokes the test with proper context binding using Function.prototype.apply
     *
     * The callback function follows Node.js convention with an optional error as first parameter.
     *
     * @internal
     * @see ContextInterface
     *
     * @since 1.0.0
     */

    private async executeCallbackStyleTest(context: ContextType<ContextInterface>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const callbackFn = (error?: string | { message: string }): void => {
                if (error) reject(error);
                resolve();
            };

            const allParameters = [ ...this.testParameters ];
            allParameters.push(callbackFn);

            this.testImplementation.apply(context, allParameters);
        });
    }

    /**
     * Calculates the elapsed execution time of the test in milliseconds.
     *
     * @returns Number representing the test execution duration in milliseconds
     *
     * @remarks
     * This method computes the time difference between now and when the test started execution.
     * It returns 0 if the test has not yet started (when executionStartTime is 0).
     * The time measurement uses the system clock via Date.now().
     *
     * @internal
     * @since 1.0.0
     */

    private getExecutionDuration(): number {
        if (this.executionStartTime === 0) return 0;

        return Date.now() - this.executionStartTime;
    }

    /**
     * Emits a status notification event about a test's lifecycle state.
     *
     * @param type - The type of status event to emit (e.g., started, passed, failed)
     *
     * @remarks
     * This method broadcasts notifications about test status changes through the event system.
     * It includes identifying information about the test: its kind, lineage, and description.
     * These notifications are typically used by reporters to provide test execution feedback.
     *
     * @internal
     * @see KindType
     * @see EmitStatusEventType
     *
     * @since 1.0.0
     */

    private notifyTestStatus(type: EmitStatusEventType): void {
        emitStatus(type, {
            kind: KindType.TEST,
            ancestry: this.ancestry,
            description: this.description
        });
    }

    /**
     * Emits an action event when a test execution has a significant state change.
     *
     * @param type - The type of action event to emit (e.g., start, complete, skip)
     * @param errors - Collection of errors that occurred during test execution
     *
     * @remarks
     * This method broadcasts notifications about test execution actions through the event system.
     * It includes comprehensive information about the test:
     * - Any errors that occurred
     * - Test type as a KindType
     * - The test's ancestry (parent hierarchy)
     * - Execution duration up to the point of notification
     * - Source code location information
     * - The test's description text
     * These action events are typically consumed by reporters and test runners.
     *
     * @internal
     * @see KindType
     * @see EmitActionEventType
     *
     * @since 1.0.0
     */

    private notifyTestAction(type: EmitActionEventType, errors: Array<unknown> = []): void {
        emitAction(type, {
            errors,
            kind: KindType.TEST,
            ancestry: this.ancestry,
            duration: this.getExecutionDuration(),
            location: this.executionLocation,
            description: this.description
        });
    }

    /**
     * Emits a test failure action event with the associated error information.
     *
     * @param error - The error or errors that caused the test to fail
     *
     * @remarks
     * This method standardizes the reporting of test failures by:
     * 1. Ensuring errors are always passed as an array
     * 2. Converting single errors to array format when needed
     * 3. Delegating to the more general notifyTestAction method with the FAILURE action type
     * It serves as a specialized wrapper around the general action notification system.
     *
     * @internal
     * @see ActionType
     *
     * @since 1.0.0
     */

    private notifyTestFailure(error: unknown): void {
        this.notifyTestAction(ActionType.FAILURE, Array.isArray(error) ? error : [ error ]);
    }
}
