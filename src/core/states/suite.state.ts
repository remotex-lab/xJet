/**
 * Import will remove at compile time
 */

import type { TestMode } from '@const/test.const';
import type { FlagsInterface } from '@models/interfaces/models.interface';
import type { ArgsVoidCallback, CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Imports
 */

import { TestModel } from '@models/test.model';
import { DescribeModel } from '@models/describe.model';

/**
 * Singleton class representing the state of the testing framework.
 * Manages the current `describe` context, test hierarchy, and hooks.
 */


export class SuiteState {
    /**
     * Singleton instance of the EclipseState class.
     */

    private static instance: SuiteState;

    /**
     * Indicates if the 'only' mode is enabled.
     * When enabled, only the tests or describe blocks flagged as 'only' will be executed.
     * If any test or describe block is flagged with 'only', this mode will be enabled automatically.
     */

    private onlyMode: boolean = false;

    /**
     * The current `describe` block being processed.
     */

    private currentDescribe: DescribeModel;

    /**
     * An array representing the hierarchy of describe block names.
     */

    private describeHierarchy: Array<string> = [];

    /**
     * The current test being executed within the testing framework.
     * It can hold an instance of TestModel representing the currently running test,
     * or null if no test is currently active.
     */

    private currentTest: TestModel | null = null;

    /**
     * The root describe block of the testing framework.
     */

    private readonly rootDescribe: DescribeModel;

    /**
     * Private constructor to enforce a singleton pattern and initialize the root `describe`.
     */

    private constructor() {
        this.rootDescribe = new DescribeModel();
        this.currentDescribe = this.rootDescribe;
    }

    /**
     * Retrieves the singleton instance of EclipseState.
     *
     * @returns The singleton instance of EclipseState.
     */

    static getInstance(): SuiteState {
        if (!SuiteState.instance) {
            SuiteState.instance = new SuiteState();
        }

        return SuiteState.instance;
    }


    /**
     * If only mode flag enable
     */

    get isOnlyMode(): boolean {
        return this.onlyMode;
    }

    /**
     * Get root describe
     */

    get root(): DescribeModel {
        return this.rootDescribe;
    }

    /**
     * Checks if a test is currently running and returns the test object if so.
     *
     * @returns The currently running test object, or null if no test is running.
     */

    getCurrentTest(): TestModel | null {
        return this.currentTest;
    }

    /**
     * Adds a new `describe` block to the current context.
     *
     * @param name - The name of the `describe` block.
     * @param block - The function representing the body of the `describe` block.
     * @param flags - Flags associated with the `describe` block (e.g., skip, only).
     */

    addDescribe(name: string, block: ArgsVoidCallback, flags: FlagsInterface = {}): void {
        this.onlyMode ||= flags.only ?? false;

        const newDescribe = new DescribeModel(name, flags);
        newDescribe.inheritFromParentDescribe(this.currentDescribe);
        this.currentDescribe.addDescribe(newDescribe);
        const previousDescribe = this.currentDescribe;
        this.currentDescribe = newDescribe;

        try {
            this.describeHierarchy.push(name); // Add current describe to hierarchy
            block();
        } catch (error) {
            (<Error> error).message = `Error in suite "${ this.currentDescribe.name }" - ${ (<Error> error).message }`;
            throw error;
        } finally {
            this.describeHierarchy.pop(); // Remove current describe after block execution
            this.currentDescribe = previousDescribe;
        }
    }

    /**
     * Adds a new test to the current `describe` block.
     *
     * @param name - The name of the test.
     * @param blockFn - The function representing the body of the test.
     * @param flags - Flags associated with the test (e.g., skip, only).
     * @param mode - The mode of the test case.
     */

    addTest(name: string, blockFn: ArgsVoidCallback | CallbackHandler, flags: FlagsInterface = {}, mode: TestMode): void {
        this.onlyMode ||= flags.only ?? false;
        const newTest = new TestModel(name, blockFn, mode, flags, [ ...this.describeHierarchy ]);
        newTest.inheritFromParentDescribe(this.currentDescribe.getFlags());
        // newTest.position = getAnonymousCallerPosition();
        this.currentDescribe.addTest(newTest);
    }

    /**
     * Adds a hook to execute before all tests in the current `describe` block.
     *
     * @param hook - The function representing the hook.
     */

    beforeAll(hook: CallbackHandler): void {
        this.currentDescribe.addHook('beforeAll', hook);
    }

    /**
     * Adds a hook to execute before each test in the current `describe` block.
     *
     * @param hook - The function representing the hook.
     */

    beforeEach(hook: CallbackHandler): void {
        this.currentDescribe.addHook('beforeEach', hook);
    }

    /**
     * Adds a hook to execute after all tests in the current `describe` block.
     *
     * @param hook - The function representing the hook.
     */

    afterAll(hook: CallbackHandler): void {
        this.currentDescribe.addHook('afterAll', hook);
    }

    /**
     * Adds a hook to execute after each test in the current `describe` block.
     *
     * @param hook - The function representing the hook.
     */

    afterEach(hook: CallbackHandler): void {
        this.currentDescribe.addHook('afterEach', hook);
    }
}
