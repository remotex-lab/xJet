/**
 * Globals
 */

declare global {
    /**
     * Send test response
     */

    function sendResponse(data: string): void;

    /**
     * Package version
     */

    const __VERSION: string;

    /**
     * Test filename
     */

    const __filename__: string;

    /**
     * Ansi color active
     */

    var __ACTIVE_COLOR: boolean;
}

export {};
