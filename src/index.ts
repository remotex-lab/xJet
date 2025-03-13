/**
 * Exports type
 */

import '@global/components/polyfill.component';
import { spyOn } from '@global/mock/spy.mock';
import { fnMock, mock } from '@global/mock/fn.mock';
// import * as x2 from 'expect';
import  { testDirective } from '@global/directives/test.directive';
import  { describeDirective } from '@global/directives/describe.directive';
import {
    afterAllDirective,
    afterEachDirective,
    beforeAllDirective,
    beforeEachDirective
} from '@global/directives/hook.directive';
import { suiteState } from '@global/states/suite.state';
export type { xJetConfig } from '@configuration/interfaces/configuration.interface';

/**
 * Global declaration
 */

export interface xJetInterface {
    fn: typeof fnMock;
    mock: typeof mock;
    spyOn: typeof spyOn;
    suiteState: typeof suiteState;
}


declare global {
    const xJet: xJetInterface;
    const it: typeof testDirective;
    const test: typeof testDirective;
    const describe: typeof describeDirective;
    const afterAll: typeof afterAllDirective;
    const afterEach: typeof afterEachDirective;
    const beforeAll: typeof beforeAllDirective;
    const beforeEach: typeof beforeEachDirective;
    // const expect: x2.Expect;
}


// Initialize global API
const setupGlobals = () => {
    const globals = globalThis as { [key: string]: unknown; };

    // Set up xJet utility object
    globals.xJet = {
        fn: fnMock,
        mock: mock,
        spyOn: spyOn,
        suiteState: suiteState
    };

    // Set up test directives
    globals.it = testDirective;
    globals.test = testDirective;
    globals.describe = describeDirective;
    globals.afterAll = afterAllDirective;
    globals.afterEach = afterEachDirective;
    globals.beforeAll = beforeAllDirective;
    globals.beforeEach = beforeEachDirective;
    // globals.expect = x2.expect;
};

setupGlobals();
suiteState.root.execute(<any> {});
