/**
 * Import will remove at compile time
 */

import type { RuntimeConfigInterface } from '@adapters/interfaces/base-adapter.interface';

/**
 * Globals
 */

declare global {
    /**
     * Package version
     */

    const __VERSION: string;

    /**
     * xJet runtime config
     */

    const __XJET__: RuntimeConfigInterface;

    /**
     * Dispatch message result from test runner
     */

    function dispatch(data: Buffer): void;
}

export {};
