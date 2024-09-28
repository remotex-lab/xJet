/**
 * Import will remove at compile time
 */

import type { CallbackHandler } from '@directives/interfaces/driective.interface';

/**
 * Imports
 */

import * as hooks from '@directives/hooks.directive';
import { SuiteState as state } from '@states/suite.state';
import { test as testFn } from '@directives/test.directive';
import { describe as describeFn } from '@directives/describe.directive';

/**
 * Declare global function
 */

declare global {
    let test: typeof testFn;
    let describe: typeof describeFn;
    let SuiteState: typeof state;
    function afterAll(hook: CallbackHandler): void;
    function beforeAll(hook: CallbackHandler): void;
    function afterEach(hook: CallbackHandler): void;
    function beforeEach(hook: CallbackHandler): void;
}

test = testFn;
describe = describeFn;
SuiteState = state;
globalThis.afterAll = hooks.afterAll;
globalThis.beforeAll = hooks.beforeAll;
globalThis.afterEach = hooks.afterEach;
globalThis.beforeEach = hooks.beforeEach;
