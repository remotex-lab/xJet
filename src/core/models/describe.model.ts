/**
 * Import will remove at compile time
 */

import type { TestModel } from '@models/test.model';
import type { DescribeHooksInterface, FlagsInterface } from '@models/interfaces/models.interface';
import type { ArgsVoidCallback, AsyncVoidCallback, CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Imports
 */

import { TestEventType } from '@const/test.const';
import { isPromise } from '@components/promise.component';
import { dispatch } from '@components/dispatch.component';

/**
 * Represents a `describe` block model in the testing framework.
 * It includes the name, tests, flags, nested describes, and hooks associated with the `describe` block.
 */

export class DescribeModel {
    /**
     * The name of the `describe` block.
     */

    readonly name: string;

    /**
     * The list of tests within the `describe` block.
     */

    private readonly tests: Array<TestModel>;

    /**
     * The list of nested describe blocks.
     */

    private readonly describeStack: Array<DescribeModel>;

    /**
     * The flags associated with the `describe` block, such as `skip` or `only`.
     */

    private readonly flags: FlagsInterface;

    /**
     * The hooks associated with the describe block, executed at various stages of the tests.
     */

    private readonly hooks: DescribeHooksInterface;

    /**
     * Creates an instance of DescribeModel.
     *
     * @param name - The name of the `describe` block.
     * @param flags - The flags associated with the `describe` block.
     */

    constructor(name: string = '', flags: FlagsInterface = {}) {
        this.name = name;
        this.tests = [];
        this.flags = flags;
        this.describeStack = [];

        this.hooks = {
            afterAll: [],
            beforeAll: [],
            afterEach: [],
            beforeEach: []
        };
    }

    /**
     * Retrieves the flags associated with the describe block.
     * Flags control behaviors and statuses within the describe block.
     *
     * @returns The flags object containing behavior and status flags for the describe block.
     */

    getFlags(): FlagsInterface {
        return this.flags;
    }

    /**
     * Adds hooks and flags from a parent describe block to the current `describe` block.
     * This method ensures that hooks and flags set in parent describe blocks are inherited
     * by the child describe blocks, maintaining the correct test execution context.
     *
     * @param parentDescribe - The parent `describe` block from which to inherit hooks and flags.
     *                         If no parent describe block is provided, the method returns without
     *                         making any changes.
     */

    inheritFromParentDescribe(parentDescribe?: DescribeModel): void {
        if (!parentDescribe) {
            return;
        }

        // Inherit hooks from the parent describe block
        this.hooks.afterAll = [ ...parentDescribe.hooks.afterAll ];
        this.hooks.beforeAll = [ ...parentDescribe.hooks.beforeAll ];
        this.hooks.afterEach = [ ...parentDescribe.hooks.afterEach ];
        this.hooks.beforeEach = [ ...parentDescribe.hooks.beforeEach ];

        // Inherit flags from the parent describe block
        Object.entries(parentDescribe.getFlags()).forEach(([ key, value ]) => {
            if (value) {
                this.flags[key as keyof FlagsInterface] ||= value;
            }
        });
    }

    /**
     * Adds a hook to the `describe` block.
     *
     * @param type - The type of hook to add.
     * @param hook - The hook function to add.
     */

    addHook(type: keyof DescribeHooksInterface, hook: CallbackHandler): void {
        if (this.hooks[type]) {
            this.hooks[type].push(hook);
        } else {
            throw new Error(`Invalid hook type: ${ type }`);
        }
    }

    /**
     * Adds a test to the `describe` block.
     *
     * @param test - The test model to add.
     */

    addTest(test: TestModel): void {
        this.tests.push(test);
    }

    /**
     * Adds a nested `describe` block to the current describe block.
     *
     * @param describe - The `describe` model to add.
     */

    addDescribe(describe: DescribeModel) {
        this.describeStack.push(describe);
    }

    /**
     * Executes the test suite, including tests and nested describe blocks,
     * while handling hooks and dispatching events for test outcomes.
     */

    async exec(): Promise<void> {
        await this.runBeforeAllHooks();
        await this.runTestsSequentially();
        await this.runDescribeBlocks();
        await this.runAfterAllHooks();
    }

    /**
     * Runs all `beforeAll` hooks, handling any errors by dispatching a failure event.
     */

    private async runBeforeAllHooks(): Promise<void> {
        try {
            await this.runHooks(this.hooks.beforeAll);
        } catch (error: unknown) {
            await this.handleHookFailure(<Error> error);
        }
    }

    /**
     * Runs all `afterAll` hooks, handling any errors by dispatching a failure event.
     */

    private async runAfterAllHooks(): Promise<void> {
        try {
            await this.runHooks(this.hooks.afterAll);
        } catch (error: unknown) {
            await this.handleHookFailure(<Error> error);
        }
    }

    /**
     * Handles failure during hook execution by dispatching a failure event.
     *
     * @param error - The error that occurred during hook execution.
     */

    private async handleHookFailure(error: Error): Promise<void> {
        await this.dispatchTestEvent(TestEventType.HOOK_FAILURE, this.tests[0], {
            stack: error.stack,
            message: error.message
        });
    }

    /**
     * Runs all tests sequentially.
     */

    private async runTestsSequentially(): Promise<void> {
        for (const test of this.tests) {
            await this.runTest(test);
        }
    }

    /**
     * Runs all describe blocks sequentially.
     */

    private async runDescribeBlocks(): Promise<void> {
        for (const describe of this.describeStack) {
            await describe.exec();
        }
    }

    /**
     * Runs a single test, handling `hooks` and error scenarios.
     *
     * @param test - The test to execute.
     */

    private async runTest(test: TestModel): Promise<void> {
        const testContext = Object.create(null);

        try {
            await this.runHooks(this.hooks.beforeEach, testContext);
            await test.exec(testContext);
            await this.runHooks(this.hooks.afterEach, testContext);
        } catch (error: unknown) {
            await this.dispatchTestEvent(TestEventType.FAILURE, test, {
                stack: (<Error> error).stack,
                message: (<Error> error).message
            });
        }
    }

    /**
     * Runs a list of hooks asynchronously.
     *
     * @param hooks - An array of hook functions.
     * @param context - Optional context object to be passed to hooks.
     */

    private async runHooks(hooks: CallbackHandler[], context: unknown = Object.create(null)): Promise<void> {
        if (this.flags.skip) {
            return;
        }

        for (const hook of hooks) {
            if (isPromise(hook) && hook.length > 0) {
                // throw new StackError(`Async hook '${ hook.name }' should not use 'done' callback.`);
            }

            if (hook.length > 0) {
                await new Promise<void>((resolve) => {
                    (<ArgsVoidCallback> hook).call(context, () => resolve());
                });
            } else {
                await (<AsyncVoidCallback> hook).call(context);
            }
        }
    }

    /**
     * Dispatches a test event to the eclipse service.
     *
     * @param eventType - The type of the test event to be dispatched.
     * @param test - The test associated with the event.
     * @param error - Optional error object providing context for failure events.
     *
     * @remarks
     * This method is responsible for communicating the outcome of a test case to the eclipse service.
     * The `eventType` parameter specifies the nature of the event (e.g., START, SKIP, TODO, SUCCESS, FAILURE).
     * The optional `error` parameter allows for passing an error object in the case of a test failure,
     * providing additional context for the failure.
     */

    // todo Error
    private async dispatchTestEvent(eventType: TestEventType, test: TestModel, error?: any): Promise<void> {
        return dispatch({
            type: eventType,
            test,
            error
        });
    }
}
