/**
 * Globals
 */

declare global {
    /**
     * Package version
     */

    declare const __VERSION: string;

    /**
     * Dispatch message result from test runner
     */

    declare function dispatch(data: Buffer): void;

    /**
     * Global type declarations for xJet
     */

    namespace __XJET {
        /**
         * Import will remove at compile time
         */

        import type { RuntimeConfigInterface } from '@targets/interfaces/base-traget.interface';

        /**
         * Runtime information
         */

        declare const runtime: RuntimeConfigInterface;
    }
}

export {}
