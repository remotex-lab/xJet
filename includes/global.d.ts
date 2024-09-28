/**
 * Globals
 */

declare global {
    /**
     * Package version
     */

    declare const __VERSION: string;

    /**
     * Global type declarations for xJet
     */

    namespace __XJET {
        /**
         * Runtime information
         */

        declare const runtime: any;

        /**
         * Dispatch message result from test runner
         */

        declare function dispatch(data: Buffer): void;
    }
}

export {}
