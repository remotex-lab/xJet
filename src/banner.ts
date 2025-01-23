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

/**
 * Global declaration
 */

declare global {
    var xJet: xJetInterface;
}

globalThis.xJet.fn = fnMock;
globalThis.xJet.mock = mock;
globalThis.xJet.spyOn = spyOn;
