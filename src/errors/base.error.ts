/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';

export abstract class BaseError extends Error {

    protected formattedStack: string;

    protected constructor(message: string, public readonly sourceMap?: SourceService) {
        super(message);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseError);
        }

        // Assign the name of the error
        this.name = 'xJetBaseError';
        this.formattedStack = this.stack ?? '';
    }

    get formatStack(): string | undefined {
        return this.formattedStack;
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.formattedStack;
    }
}
