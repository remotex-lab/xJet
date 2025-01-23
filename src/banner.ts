/**
 * Import will remove at compile time
 */

import type { xJetInterface } from '@interfaces/banner.interface';

/**
 * Polyfill
 */

import '@global/components/polyfill.component';

/**
 * Imports
 */

import { spyOn } from '@global/mock/spy.mock';
import { fnMock, mock } from '@global/mock/fn.mock';
import { suiteState } from '@global/states/suite.state';
import { testDirective } from '@global/directives/test.directive';
import { describeDirective } from '@global/directives/describe.directive';
import {
    afterAllDirective,
    afterEachDirective,
    beforeAllDirective,
    beforeEachDirective
} from '@global/directives/hook.directive';

/**
 * Global declaration
 */

declare global {
    var xJet: xJetInterface;
    var it: typeof testDirective;
    var test: typeof testDirective;
    var describe: typeof describeDirective;
    var afterAll: typeof afterAllDirective;
    var afterEach: typeof afterEachDirective;
    var beforeAll: typeof beforeAllDirective;
    var beforeEach: typeof beforeEachDirective;
}

globalThis.xJet = <xJetInterface> {};
globalThis.xJet.fn = fnMock;
globalThis.xJet.mock = mock;
globalThis.xJet.spyOn = spyOn;
globalThis.xJet.suiteState = suiteState;
globalThis.it = testDirective;
globalThis.test = testDirective;
globalThis.describe = describeDirective;
globalThis.afterAll = afterAllDirective;
globalThis.afterEach = afterEachDirective;
globalThis.beforeAll = beforeAllDirective;
globalThis.beforeEach = beforeEachDirective;
