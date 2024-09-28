/**
 * Import will remove at compile time
 */

import type { CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Imports
 */

import { SuiteState } from '@states/suite.state';

/**
 * Registers a hook to be run once before all tests.
 *
 * @example
 * ```ts
 * import { beforeAll } from '@test/hooks';
 *
 * beforeAll(() => {
 *     // Connect to DB
 * });
 * ```
 *
 * @param hook - The hook function to be registered.
 */

export function beforeAll(hook: CallbackHandler): void {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Hooks cannot be defined inside tests '${ runningTest.name }'.`);
    }

    SuiteState.getInstance().beforeAll(hook);
}

/**
 * Registers a hook to be run before each test.
 *
 * @example
 * ```ts
 * import { beforeEach } from '@test/hooks';
 *
 * beforeEach(({ inject }) => {
 *      const service = inject(MyService);
 * });
 * ```
 *
 * @param hook - The hook function to be registered.
 */

export function beforeEach(hook: CallbackHandler): void {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Hooks cannot be defined inside tests '${ runningTest.name }'.`);
    }

    SuiteState.getInstance().beforeEach(hook);
}

/**
 * Registers a hook to be run once after all tests.
 *
 * @example
 * ```ts
 * import { afterAll } from '@test/hooks';
 *
 * afterAll(() => {
 *     // Close DB connection
 * });
 * ```
 *
 * @param hook - The hook function to be registered.
 */

export function afterAll(hook: CallbackHandler): void {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Hooks cannot be defined inside tests '${ runningTest.name }'.`);
    }

    SuiteState.getInstance().afterAll(hook);
}


/**
 * Registers a hook to be run after each test.
 *
 * @example
 * ```ts
 * import { afterEach } from '@test/hooks';
 *
 * afterEach(({ expect }) => {
 *     expect(1).toBe(1);
 * });
 * ```
 *
 * @param hook - The hook function to be registered.
 */

export function afterEach(hook: CallbackHandler): void {
    const runningTest = SuiteState.getInstance().getCurrentTest();
    if (runningTest) {
        throw new Error(`Hooks cannot be defined inside tests '${ runningTest.name }'.`);
    }

    SuiteState.getInstance().afterEach(hook);
}
