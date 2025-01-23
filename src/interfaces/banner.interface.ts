/**
 * Import will remove at compile time
 */

import type { mock } from '@global/mock/fn.mock';
import type { spyOn } from '@global/mock/spy.mock';
import type { fnMock } from '@global/mock/fn.mock';
import type { suiteState } from '@global/states/suite.state';

/**
 * Represents an interface for xJet functionality, providing methods for mocking and spying on entities.
 *
 * @property fn A function used to create a mock implementation.
 * @property mock A function used to establish a complete mock object for testing purposes.
 * @property spyOn A method used to track calls to a specific property or function.
 *
 * @remarks
 * This interface is primarily used in testing environments to streamline mocking and spying operations.
 *
 * @see mock
 * @see spyOn
 * @see fnMock
 *
 * @since 1.0.0
 */

export interface xJetInterface {
    fn: typeof fnMock;
    mock: typeof mock;
    spyOn: typeof spyOn;
    suiteState: typeof suiteState;
}
