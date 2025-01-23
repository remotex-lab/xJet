/**
 * Imports
 */

import type { InvocationLocationInterface } from '@global/components/interfaces/location-component.interface';

/**
 * Retrieves the location of the caller where the function was invoked.
 *
 * @returns An object containing the line and column numbers of the caller's location in the code.
 * Returns are `null` if the location cannot be determined.
 *
 * @remarks This method relies on the error stack trace and may not work consistently across different environments.
 * The extracted location is best-effort and could vary based on JavaScript engine-specific stack trace formatting.
 *
 * @since 1.0.0
 */

export function getInvocationLocation(): InvocationLocationInterface | null {
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

    return null;
}
