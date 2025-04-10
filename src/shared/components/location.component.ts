/**
 * Imports
 */

import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Retrieves the location of the caller where the function was invoked.
 *
 * @returns An object containing the line and column numbers of the caller's location in the code,
 * or undefined if the location cannot be determined.
 *
 * @throws Error - If the stack trace format is incompatible with the parsing logic
 *
 * @remarks
 * This method relies on the error stack trace and may not work consistently across different environments.
 * The extracted location is best-effort and could vary based on JavaScript engine-specific stack trace formatting.
 *
 * @example
 * ```ts
 * const callerLocation = getInvocationLocation();
 * if (callerLocation) {
 *   console.log(`Function called from line ${callerLocation.line}, column ${callerLocation.column}`);
 * } else {
 *   console.log('Could not determine caller location');
 * }
 * ```
 *
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

export function getInvocationLocation(): InvocationLocationInterface | undefined {
    const stack = <string> new Error().stack;
    const stackList = stack.split('\n');
    const caller = stackList[3] ?? '';
    const match = caller.match(/:(\d+):(\d+)/);

    if (match) {
        return {
            line: parseInt(match[1], 10),
            column: parseInt(match[2], 10)
        };
    }

    return undefined;
}
