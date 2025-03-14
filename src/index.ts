/**
 * Exports type
 */

import '@global/components/polyfill.component';
import { spyOn } from '@global/mock/spy.mock';
import { fnMock, mock } from '@global/mock/fn.mock';
import { suiteState } from '@global/states/suite.state';
export type { xJetConfig } from '@configuration/interfaces/configuration.interface';

/**
 * Global declaration
 */

export interface xJetInterface {
    fn: typeof fnMock;
    mock: typeof mock;
    spyOn: typeof spyOn;
}

declare global {
    const xJet: xJetInterface;
}

// Initialize global API
const setupGlobals = () => {
    const globals = globalThis as { [key: string]: unknown; };

    // Set up xJet utility object
    globals.xJet = {
        fn: fnMock,
        mock: mock,
        spyOn: spyOn
    };

    globals.state = suiteState;
};

setupGlobals();
