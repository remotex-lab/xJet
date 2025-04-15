// noinspection ExceptionCaughtLocallyJS

/**
 * Import will remove at compile time
 */

import type { TestModel } from '@shared/models/test.model';
import type { ContextType, FunctionType } from '@interfaces/function.interface';
import type { ContextInterface, DescribeFlagsType } from '@shared/models/interfaces/describe-model.interface';

/**
 * Imports
 */

import { encodeErrorSchema } from '@schema/action.schema';
import { emitStatus } from '@shared/services/emit.service';
import { DescribeModel } from '@shared/models/describe.model';
import { ExecutionError } from '@shared/errors/execution.error';
import { KindType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Manages the state of test suites within the testing framework, tracking the hierarchy of describe blocks and test cases.
 * Implemented as a singleton to ensure a single source of truth for the test suite structure.
 *
 * @template TestModel - The model type representing individual test cases
 * @template FunctionType - The function type for describe block implementations
 * @template DescribeModel - The model type representing test suite describe blocks
 * @template DescribeFlagsType - Configuration flags for describe blocks
 *
 * @throws Error - If you attempt to instantiate this class directly instead of using getInstance()
 *
 * @remarks
 * The singleton pattern ensures that all test registration operations work with the same
 * state instance, properly maintaining the hierarchical structure of tests.
 * Use the static getInstance() method to access the singleton instance.
 *
 * @example
 * ```ts
 * // Get the singleton instance
 * const suiteState = SuiteState.getInstance();
 *
 * // Add a describe block
 * suiteState.addDescribe('My test suite', () => {
 *   // Test suite implementation
 * }, { only: true });
 *
 * // Add a test case to the current describe block
 * suiteState.addTest(new TestModel('should work', () => {}, { skip: false }));
 * ```
 *
 * @see TestModel
 * @see DescribeModel
 *
 * @since 1.0.0
 */

export class SuiteState {
    /**
     * Singleton instance of the SuiteState class
     *
     * @internal
     * @since 1.0.0
     */

    private static instance?: SuiteState;

    /**
     * Tracks whether any test or describe block has the 'only' flag set
     *
     * @since 1.0.0
     */

    private onlyMode = !!globalThis.__XJET?.runtime?.filter;

    /**
     * Reference to the currently active describe block in the test hierarchy
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    private currentDescribe: DescribeModel;

    /**
     * Reference to the test currently being defined or executed
     *
     * @see TestModel
     * @since 1.0.0
     */

    private currentTest?: TestModel;

    /**
     * Suite has at least one test
     * @since 1.0.0
     */

    private hasTests = false;

    /**
     * The top-level describe block that contains all tests and nested describe blocks
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    private readonly rootDescribe: DescribeModel;

    /**
     * Creates a new instance of the class with a root describe block
     *
     * @internal
     * @since 1.0.0
     */

    private constructor() {
        this.rootDescribe = new DescribeModel();
        this.currentDescribe = this.rootDescribe;
    }

    /**
     * Returns the singleton instance of the SuiteState class
     *
     * @returns The shared SuiteState instance
     *
     * @remarks This method implements the Singleton pattern, creating the instance on first call
     *
     * @see SuiteState
     * @since 1.0.0
     */

    static getInstance(): SuiteState {
        if (!SuiteState.instance) {
            SuiteState.instance = new SuiteState();
        }

        return SuiteState.instance;
    }

    /**
     * Indicates whether the test suite is running in "only" mode
     *
     * @returns True if only specifically marked tests should run
     *
     * @since 1.0.0
     */

    get isOnlyMode(): boolean {
        return this.onlyMode;
    }

    /**
     * Gets the root describe block of the test suite
     *
     * @returns The top-level describe block
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    get root(): DescribeModel {
        return this.rootDescribe;
    }

    /**
     * Gets the current describe block being defined
     *
     * @returns The active describe block
     *
     * @see DescribeModel
     * @since 1.0.0
     */

    get describe(): DescribeModel {
        return this.currentDescribe;
    }

    /**
     * Gets the test currently being defined or executed
     *
     * @returns The current test or null if no test is active
     *
     * @see TestModel
     * @since 1.0.0
     */

    get test(): TestModel | undefined {
        return this.currentTest;
    }

    /**
     * Sets the current test being defined or executed
     *
     * @param test - The test to set as current
     *
     * @see TestModel
     * @since 1.0.0
     */

    set test(test: TestModel | undefined) {
        this.currentTest = test;
    }

    /**
     * Executes the entire test suite from the root describe block
     *
     * @param context - The execution context containing runtime information
     *
     * @throws Error - When test execution fails, the error is encoded and dispatched
     *
     * @remarks
     * This method initiates the test execution flow by calling run() on the root describe block
     * and emits an END status notification when all tests complete successfully. If an error
     * occurs during execution, it's captured, encoded, and dispatched through the error schema.
     *
     * @example
     * ```ts
     * const suiteState = SuiteState.getInstance();
     * await suiteState.run({
     *   timeout: 5000,
     *   currentPath: '/tests',
     *   skipAfterFailure: true
     * });
     * ```
     *
     * @see emitStatus
     * @see DescribeModel
     *
     * @since 1.0.0
     */

    async run(context: ContextType<ContextInterface>) {
        try {
            if(!this.hasTests)
                throw new ExecutionError('Your test suite must contain at least one test');

            await this.root.run(context);
            emitStatus(StatusType.END, {
                kind: KindType.SUITE,
                ancestry: [],
                description: ''
            });
        } catch (e) {
            dispatch(
                encodeErrorSchema(<Error>e, __XJET.runtime.suiteId, __XJET.runtime.runnerId)
            );
        }
    }

    /**
     * Adds a new describe block to the test suite hierarchy
     *
     * @param description - The textual description of the describe block
     * @param describeFn - The function containing the tests and nested describes
     * @param flags - Configuration options for the describe block
     * @param describeArgs - Arguments to pass to the describe function
     *
     * @throws Error - If the describe function throws any exceptions
     *
     * @remarks
     * This method temporarily changes the current describe context while executing
     * the describeFn, then restores it afterward, ensuring proper nesting of test blocks.
     * If the 'only' flag is set, it enables only-mode for the entire test suite.
     *
     * @example
     * ```ts
     * suiteState.addDescribe(
     *   'my test group',
     *   () => {
     *     // test definitions here
     *   },
     *   { only: true }
     * );
     * ```
     *
     * @see FunctionType
     * @see DescribeModel
     * @see DescribeFlagsType
     *
     * @since 1.0.0
     */

    addDescribe(description: string, describeFn: FunctionType, flags: DescribeFlagsType = {}, describeArgs: Array<unknown> = []): void {
        if (flags.only) {
            this.onlyMode = true;
        }

        const newDescribe = new DescribeModel(description, flags);
        this.currentDescribe.addDescribe(newDescribe);
        const previousDescribe = this.currentDescribe;
        this.currentDescribe = newDescribe;

        try {
            describeFn.apply({}, describeArgs);
        } finally {
            this.currentDescribe = previousDescribe;
        }
    }

    /**
     * Adds a test to the current describe block
     *
     * @param test - The test model to add
     *
     * @remarks
     * If the test has the 'only' option set, it enables only-mode for the entire test suite.
     *
     * @see TestModel
     * @since 1.0.0
     */

    addTest(test: TestModel): void {
        if(!this.hasTests)
            this.hasTests = true;

        if (test.options.only) this.onlyMode = true;
        this.currentDescribe.addTest(test);
    }
}
