/**
 * Exports type
 */

export type { AbstractReporter } from '@reports/abstract.reporter';
export type { xJetConfig } from '@configuration/interfaces/configuration.interface';

/**
 * Global polyfills
 */

import '@shared/components/polyfill.component';

/**
 * Import will remove at compile time
 */

import type { TestDirectiveInterface } from '@shared/directives/interfaces/test-directive.interface';
import type { DescribeDirectiveInterface } from '@shared/directives/interfaces/describe-directive.interface';

/**
 * Imports
 */

import {
    afterAllDirective,
    afterEachDirective,
    beforeAllDirective,
    beforeEachDirective
} from '@shared/directives/hook.directive';
import { MockState } from '@shared/states/mock.state';
import { SuiteState } from '@shared/states/suite.state';
export { encodeErrorSchema } from '@schema/action.schema';
import * as logging from '@shared/components/log.component';
import { spyOnImplementation } from '@shared/mock/spy.mock';
import { TestDirective } from '@shared/directives/test.directive';
import { DescribeDirective } from '@shared/directives/describe.directive';
import { fnImplementation, mockImplementation } from '@shared/mock/fn.mock';

/**
 * Clears the specified mock method on all registered mocks
 *
 * @param method - The method name to clear on all mock instances
 *
 * @throws TypeError - When called with an invalid method name
 *
 * @remarks
 * This utility function iterates through all mocks registered in the MockState
 * and calls the specified method on each one, effectively performing a batch operation
 * across all mock instances.
 *
 * @example
 * ```ts
 * // Clear all recorded calls on all mocks
 * clearMocks('resetHistory');
 *
 * // Reset behavior on all mocks
 * clearMocks('resetBehavior');
 * ```
 *
 * @see MockState
 *
 * @since 1.0.0
 */

function clearMocks(method: keyof MockState): void {
    const mock = [ ...MockState.mocks ];
    mock.map((mock) => {
        mock[method]();
    });
}

/**
 * Global declaration
 */

declare global {
    namespace xJet {
        const fn: typeof fnImplementation;
        const mock: typeof mockImplementation;
        const spyOn: typeof spyOnImplementation;
        const log: typeof console.log;
        const info: typeof console.info;
        const warn: typeof console.warn;
        const error: typeof console.error;
        const debug: typeof console.error;
        const clearAllMocks: () => void;
        const resetAllMocks: () => void;
        const restoreAllMocks: () => void;
    }

    const it: TestDirectiveInterface;
    const test: TestDirectiveInterface;
    const describe: DescribeDirectiveInterface;
    const afterAll: typeof afterAllDirective;
    const beforeAll: typeof beforeAllDirective;
    const afterEach: typeof afterEachDirective;
    const beforeEach: typeof beforeEachDirective;
}

/**
 * Set global
 */

const setupGlobals = () => {
    const globals = globalThis as { [key: string]: unknown; };

    globals.xJet = {
        fn: fnImplementation,
        mock: mockImplementation,
        spyOn: spyOnImplementation,
        log: logging.log,
        info: logging.info,
        warn: logging.warn,
        error: logging.error,
        debug: logging.debug,
        clearAllMocks: () => clearMocks('mockClear'),
        resetAllMocks: () => clearMocks('mockReset'),
        restoreAllMocks: () => clearMocks('mockRestore')
    };

    globals.state = SuiteState;
    globals.it = TestDirective.getInstance();
    globals.test = TestDirective.getInstance();
    globals.describe = DescribeDirective.getInstance();
    globals.afterAll = afterAllDirective;
    globals.beforeAll = beforeAllDirective;
    globals.afterEach = afterEachDirective;
    globals.beforeEach = beforeEachDirective;
};

setupGlobals();
