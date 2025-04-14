/**
 * Import will remove at compile time
 */

import type { ConsoleMethodType } from '@shared/components/interfaces/log-component.interface';

/**
 * Imports
 */

import { encodeSchema } from '@schema/action.schema';
import { SuiteState } from '@shared/states/suite.state';
import { formatValue } from '@components/json.component';
import { SchemaType } from '@schema/constants/action-schema.constants';
import { getInvocationLocation } from '@shared/components/location.component';
import { LogLevel } from '@shared/components/constants/log-component.constants';

/**
 * Creates a logging function that formats and dispatches log messages with timestamps
 *
 * @template T - Console method type that determines the log level
 * @param type - The type of console method (log, info, warn, error) to create a handler for
 * @returns A function that accepts any number of arguments, formats them, and dispatches a log event
 *
 * @throws TypeError - When invalid arguments are provided to the returned function
 *
 * @remarks
 * This function acts as a factory for creating specialized logging handlers. Each handler:
 * - Timestamps the log entry with ISO format
 * - Formats all arguments into string representations
 * - Dispatches the log event with the appropriate log level
 * - Maintains a consistent format for all log messages
 *
 * @example
 * ```ts
 * const logInfo = createLogHandler('info');
 * logInfo('User', user.id, 'logged in successfully');
 * // Dispatches a log event with level: 'INFO', formatted arguments, and timestamp
 * ```
 *
 * @see formatValue
 * @see dispatch
 * @see SchemaType
 * @see LogLevel
 *
 * @since 1.0.0
 */

export function createLogHandler(type: ConsoleMethodType) {
    return function (...args: unknown[]): void {
        const timestamp = new Date().toISOString();

        const describeName = SuiteState.getInstance().describe.description;
        const testName = SuiteState.getInstance().test?.description;
        const context = testName ?? describeName;

        // Format arguments for the description
        const formattedArgs = args.map(formatValue).join(' ');
        const location = getInvocationLocation();

        // Dispatch log event
        dispatch(encodeSchema(SchemaType.LOG, {
            level: LogLevel[type],
            context: context,
            location: location,
            timestamp: timestamp,
            description: formattedArgs
        }));
    };
}

/**
 * Standard log level function for general purpose logging
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const log = createLogHandler('LOG');

/**
 * Informational log function for highlighting noteworthy application events
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const info = createLogHandler('INFO');

/**
 * Warning log function for potential issues that aren't errors
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const warn = createLogHandler('WARN');

/**
 * Error log function for reporting application errors and exceptions
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const error = createLogHandler('ERROR');

/**
 * Debug log function for detailed diagnostic information
 *
 * @see createLogHandler
 * @see LogLevel
 *
 * @since 1.0.0
 */

export const debug = createLogHandler('DEBUG');
