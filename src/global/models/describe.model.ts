/**
 * Import will remove at compile time
 */

import type { TestModel } from '@global/models/test.model';
import type { HookModel } from '@global/models/hook.model';
import type { ContextType } from '@interfaces/function.interface';
import type { ContextInterface, DescribeFlagsType, DescribeHooksInterface } from '@global/models/interfaces/describe-model.interface';

/**
 * Imports
 */
import { emitService } from '@global/services/emit.service';
import { ActionType } from '@core/handler/constants/message-handler.constant';
import { HookType } from '@global/models/constants/describe-model.constants';

/**
 * Represents a test suite or describe block where tests and sub-describe blocks
 * can be registered and executed, following a hierarchy of parent-child describes.
 *
 * @remarks
 * The `DescribeModel` class allows hierarchical test suite construction, supports hooks for lifecycle events,
 * and enables test organization into nested describe blocks.
 * It also handles execution and error propagation
 * for hooks and tests within its scope.
 *
 * This class is designed to be used with a test framework where tests and hooks are dynamically registered
 * and executed procedurally, following the specificity of added hooks and describe flags.
 * Use this class to programmatically compose and execute test suites.
 *
 * @since 1.0.0
 */

export class DescribeModel {
    /**
     * Represents an array of parent identifiers.
     *
     * @remarks
     * This variable holds a collection of strings, where each string represents a parent identifier.
     * It can be used to model hierarchical relationships,
     * manage family trees, or track parent links in various data structures.
     *
     * @since 1.0.0
     */

    readonly parents: Array<string>;

    /**
     * A stack that holds instances of TestModel.
     *
     * @remarks This stack is utilized for managing and organizing test data,
     * often in testing scenarios where a sequence of tests is required.
     *
     * @see TestModel
     *
     * @since 1.0.0
     */

    private readonly testsStack: Array<TestModel>;

    /**
     * Represents a collection of `DescribeModel` objects that define the structure
     * or specification of individual test or behavior descriptions.
     *
     * @remarks
     * This variable is used to store an array of descriptive models to organize
     * and manage stack-like behaviors, scenarios, or configurations.
     *
     * @see DescribeModel
     *
     * @since 1.0.0
     */

    private readonly describesStack: Array<DescribeModel>;

    /**
     * Represents the initial starting time of an event or process, typically measured in milliseconds since the Unix epoch.
     *
     * @remarks
     * The `startTime` variable is crucial for tracking time-dependent operations and calculations.
     * Ensure that the value is properly set to avoid inconsistencies in time-based logic.
     *
     * @since 1.0.0
     */

    private startTime: number;

    /**
     * Object containing hook arrays for managing lifecycle events.
     *
     * Hooks allow developers to execute specific logic at different stages of a lifecycle.
     * The hooks include `afterAll`, `afterEach`, `beforeAll`, and `beforeEach`.

     * @remarks
     * Use these hooks to orchestrate setup and teardown logic, ensuring a clean environment
     * for tests or other operations.
     * Note that improper usage of hooks may cause unexpected side effects.
     *
     * @see DescribeHooksInterface
     *
     * @since 1.0.0
     */

    private hooks: DescribeHooksInterface = {
        afterAll: [],
        afterEach: [],
        beforeAll: [],
        beforeEach: []
    };

    /**
     * Initializes a new instance of the class with the specified name and describe flags.
     *
     * @param name - The name to be assigned to the instance.
     * Default to an empty string if not provided.
     * @param describeFlags - An object containing describe flags used for configuration.
     * Default to an empty object if not provided.
     *
     * @remarks This constructor initializes internal state values such as `parents`, `startTime`, `testsStack`, and `describesStack`.
     *
     * @since 1.0.0
     */

    constructor(
        readonly name: string = '',
        private readonly describeFlags: DescribeFlagsType = { skip: false, only: false }
    ) {
        this.parents = [];
        this.startTime = 0;
        this.testsStack = [];
        this.describesStack = [];
    }

    /**
     * Retrieves the current flags of the object.
     *
     * @return An object containing the detailed description of the flags.
     *
     * @remarks
     * This method returns an object of type `DescribeFlagsType`, which describes
     * the flags associated with the current instance.
     *
     * @since 1.0.0
     */

    get flags(): DescribeFlagsType {
        return this.describeFlags;
    }

    /**
     * Retrieves a list of all tests contained within this suite, including tests from child suites.
     *
     * @return An array of `TestModel` instances representing the current suite's tests and the tests from its child suites.
     *
     * @remarks
     * This method aggregates the tests defined in the current test suite and recursively includes
     * tests from any child test suites for a complete hierarchical representation.
     *
     * @since 1.0.0
     */

    get tests(): Array<TestModel> {
        const result: Array<TestModel> = [];

        // Add tests from this suite
        result.push(...this.testsStack);

        // Add tests from child suites
        this.describesStack.forEach(child => {
            result.push(...child.tests);
        });

        return result;
    }

    /**
     * Executes the test suite by running tests and describes along with their associated hooks.
     *
     * @param context - The execution context containing the state and hooks to manage the test lifecycle.
     * @returns A promise that resolves when the execution process completes.
     *
     * @remarks This method orchestrates the execution of all tests and describes blocks registered in the stack,
     * running lifecycle hooks (`beforeAll` and `afterAll`) appropriately.
     * It also handles event dispatching based on the execution status.
     *
     * @since 1.0.0
     */
    async execute(context: ContextType<ContextInterface>): Promise<void> {
        this.startTime = Date.now();
        await this.dispatchDescribeEvent(ActionType.START);
        await this.executeHooks(HookType.BEFORE_ALL, context);
        for (const test of this.testsStack) {
            await test.execute(context, this.executeHooks.bind(this));
        }

        for (const describe of this.describesStack) {
            await describe.execute(context);
        }

        await this.executeHooks(HookType.AFTER_ALL, context);
        await this.dispatchDescribeEvent(ActionType.SUCCESS);
        await this.dispatchDescribeEvent(ActionType.FAILURE, context.afterAllErrors);

        context.beforeAllErrors = [];
        context.afterAllErrors = [];
    }

    /**
     * Adds a hook of the specified type to the list of hooks.
     *
     * @param type - The type of the hook to add.
     * Must be a valid `HookType` value.
     * @param hook - The hook model instance to add to the specified type.
     *
     * @remarks This method associates a hook with a specific hook type.
     * Hooks are grouped by type and stored.
     *
     * @since 1.0.0
     */

    addHook(type: HookType, hook: HookModel): void {
        if (this.hooks[type]) {
            this.hooks[type].push(hook);
        } else {
            throw new Error(`Invalid hook type: ${ type }`);
        }
    }

    /**
     * Adds a test to the current test stack.
     *
     * @param test - The test instance of type `TestModel` to be added.
     *
     * @remarks This method links the given test to its parent describe block and stores it in the test stack.
     *
     * @since 1.0.0
     */

    addTest(test: TestModel): void {
        test.inheritFromParentDescribe(this);
        this.testsStack.push(test);
    }

    /**
     * Adds a `DescribeModel` instance to the described stack and ensures it inherits attributes from the parent describe.
     *
     * This method is used to attach a new described block to the current context,
     * maintaining inheritance and hierarchical structure.
     *
     * @param describe - The `DescribeModel` instance to add and inherit from the parent describe.
     *
     * @remarks This method modifies the internal `describesStack` to append a new described instance.
     *
     * @since 1.0.0
     */

    addDescribe(describe: DescribeModel): void {
        if (!describe) return;

        describe.inheritFromParentDescribe(this);
        this.describesStack.push(describe);
    }

    /**
     * Executes a hook sequence of the specified type, passing the provided context to each hook.
     *
     * @param type - The type of hooks to execute (e.g., pre, post).
     * @param context - The context to be passed to each hook for execution.
     * @returns A promise that resolves when all hooks of the specified type have been executed.
     *
     * @remarks This method skips execution if the `skip` flag is enabled.
     *
     * @since 1.0.0
     */

    private async executeHooks(type: HookType, context: ContextType<ContextInterface>): Promise<void> {
        if (this.flags.skip) return;
        for (const hook of this.hooks[type]) {
            try {
                await hook.execute(context);
            } catch (error) {
                await this.handleHookError(type, error, context);
            }
        }
    }

    /**
     * Handles errors encountered during the execution of hooks by classifying
     * them into `beforeAllErrors` or `afterAllErrors` based on the hook type.context structure.
     *
     * @param type - The type of the hook where the error occurred, e.g., BEFORE_ALL or AFTER_ALL.
     * @param error - The error object encountered during the hook execution.
     * @param context - The context object that stores the state and errors during execution.
     *
     * @remarks
     * This method is designed to segregate hook errors into specific lists depending on the hook type.
     * Errors not associated with BEFORE_ALL or AFTER_ALL hooks will be propagated
     * as they are presumed to be critical.
     *
     * @since 1.0.0
     */

    private async handleHookError(type: HookType, error: unknown, context: ContextType<ContextInterface>): Promise<void> {
        if (type === HookType.BEFORE_ALL) {
            context.beforeAllErrors.push(error);

            return;
        }

        if (type === HookType.AFTER_ALL) {
            context.afterAllErrors.push(error);

            return;
        }

        throw error;
    }


    /**
     * Inherits properties, hooks, and flags from the parent `DescribeModel` into the current instance.
     *
     * @param parentDescribe - The parent `DescribeModel` object from which properties, hooks,
     * and flags are inherited by the current instance.
     *
     * @remarks
     * This method performs inheritance by copying hooks, flags, and parent relationships from the
     * provided `parentDescribe` into the current instance.
     * It ensures that hierarchical relationships and configurations are carried over properly to maintain consistency.
     *
     * @since 1.0.0
     */

    private inheritFromParentDescribe(parentDescribe: DescribeModel): void {
        this.inheritHooks(parentDescribe);
        this.inheritFlags(parentDescribe);
        this.parents.push(...parentDescribe.parents);
        if (parentDescribe.name)
            this.parents.push(parentDescribe.name);
    }

    /**
     * Inherits hooks from the specified parent Describe model.
     * This method copies the `beforeEach` and `afterEach` hook arrays
     * from the parent `DescribeModel` into the current instance.
     *
     * @param parentDescribe - The parent `DescribeModel`, from which hooks should be inherited.
     *
     * @remarks The method assumes that the `parentDescribe` contains valid hook arrays.
     *
     * @since 1.0.0
     */

    private inheritHooks(parentDescribe: DescribeModel): void {
        this.hooks.afterEach = parentDescribe.hooks.afterEach.slice();
        this.hooks.beforeEach = parentDescribe.hooks.beforeEach.slice();
    }

    /**
     * Inherits flags from the provided parent `DescribeModel` instance
     * into the current instance.
     *
     * Flags present in the parent model will be merged into the current
     * model's `describeFlags`, only if the corresponding key does not
     * already exist or has a false value.
     *
     * @param parentDescribe - The `DescribeModel` instance from which flags
     * are inherited.
     *
     * @remarks This method performs a shallow merge of flags from the parent
     * to the current instance.
     *
     * @since 1.0.0
     */

    private inheritFlags(parentDescribe: DescribeModel): void {
        Object.entries(parentDescribe.flags).forEach(([ key, value ]) => {
            if (value) {
                this.describeFlags[key as keyof DescribeFlagsType] ||= value;
            }
        });
    }

    /**
     * Calculates the duration from the recorded start time to the current time.
     *
     * @return The duration in milliseconds since the `startTime`.
     *
     * @remarks
     * This method assumes that `startTime` is a valid timestamp in milliseconds.
     * If `startTime` has not been initialized (equal to 0), the method returns 0.
     *
     * @since 1.0.0
     */

    private getDuration(): number {
        if (this.startTime === 0)
            return 0;

        return Date.now() - this.startTime;
    }

    private async dispatchDescribeEvent(action: ActionType, errors?: Array<unknown>): Promise<void> {
        emitService.describeDispatcher({
            action: action,
            parents: this.parents,
            description: this.name,
            errors: errors
        });
    }
}
