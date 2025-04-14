/**
 * Import will remove at compile time
 */

import type { ErrorType } from '@components/interfaces/stack-component.interface';
import type { ActionType, KindType, StatusType } from '@handler/constants/message-handler.constant';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';
import type { ActionSchemaInterface, StatusSchemaInterface } from '@schema/interfaces/action-schema.interface';

/**
 * Represents the status of an operation with modified field types
 *
 * @template KindType - The type for the kind property
 *
 * @remarks
 * This type extends the StatusSchemaInterface but replaces some properties with
 * more specific types. It omits 'kind', 'action', and 'ancestry' from the base
 * interface and adds them back with different types.
 *
 * @example
 * ```ts
 * const status: StatusInterface = {
 *   kind: KindType.Group,
 *   ancestry: ['parent1', 'parent2'],
 *   // ... other StatusSchemaInterface properties
 * };
 * ```
 *
 * @see KindType
 * @see StatusSchemaInterface
 *
 * @since 1.0.0
 */

export type StatusInterface = Omit<StatusSchemaInterface, 'kind' | 'action' | 'ancestry'> & {
    kind: KindType;
    ancestry: Array<string>;
};

/**
 * Represents an action with modified field types
 *
 * @template KindType - The type for the kind property
 *
 * @remarks
 * This type extends the ActionSchemaInterface but replaces some properties with
 * more specific types. It omits 'kind', 'action', 'ancestry', and 'errors' from
 * the base interface and adds them back with different types.
 *
 * @example
 * ```ts
 * const action: ActionInterface = {
 *   kind: KindType.Task,
 *   errors: [],
 *   ancestry: ['parent1', 'parent2'],
 *   // ... other ActionSchemaInterface properties
 * };
 * ```
 *
 * @see KindType
 * @see ActionSchemaInterface
 *
 * @since 1.0.0
 */

export type ActionInterface = Omit<ActionSchemaInterface, 'kind' | 'action' | 'ancestry' | 'errors'> & {
    kind: KindType;
    errors: Array<unknown>;
    ancestry: Array<string>;
};

/**
 * Defines valid log types derived from Console methods
 *
 * @remarks
 * This type represents the set of logging methods available from the Console interface
 * that can be used for logging messages at different severity levels.
 *
 * @example
 * ```ts
 * const logLevel: LogType = 'warn';
 * console[logLevel]('This is a warning message');
 * ```
 *
 * @since 1.0.0
 */

export type LogType = keyof Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>;

/**
 * Extends the base ErrorType with optional location information
 *
 * @remarks
 * This type augments the standard ErrorType by adding an optional location property
 * that can be used to track where the error occurred in code.
 *
 * @example
 * ```ts
 * const error: EnhancedErrorType = {
 *   message: 'Something went wrong',
 *   name: 'ValidationError',
 *   location: {
 *     line: 42,
 *     column: 10,
 *     file: 'app.ts'
 *   }
 * };
 * ```
 *
 * @see ErrorType
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

export type EnhancedErrorType = ErrorType & {
    location?: InvocationLocationInterface
};

/**
 * Represents the base structure for all message types in the system
 *
 * @remarks
 * This interface defines the common properties that all messages must implement,
 * providing context about the test suite and runner that generated the message.
 * It serves as the foundation for more specific message interfaces.
 *
 * @example
 * ```ts
 * const message: MessageInterface = {
 *   suiteName: 'AuthenticationTests',
 *   runnerName: 'UserLoginRunner'
 * };
 * ```
 *
 * @since 1.0.0
 */

export interface MessageInterface {
    suiteName: string;
    runnerName: string;
}

/**
 * Represents a log message with detailed contextual information
 *
 * @remarks
 * This interface extends the base MessageInterface to include properties specific to log messages,
 * such as log type, content, context, timestamp, and source location information. It provides
 * comprehensive details about where and when a log occurred.
 *
 * @example
 * ```ts
 * const logMessage: LogMessageInterface = {
 *   suiteName: 'DataProcessingTests',
 *   runnerName: 'BatchProcessor',
 *   type: 'info',
 *   value: 'Processing completed successfully',
 *   context: 'data-transformation',
 *   timestamp: '2023-10-15T14:30:45.123Z',
 *   location: {
 *     line: 42,
 *     column: 5,
 *     file: 'processor.ts',
 *     source: 'processData'
 *   }
 * };
 * ```
 *
 * @see LogType
 * @see MessageInterface
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

export interface LogMessageInterface extends MessageInterface {
    type: LogType;
    value: string;
    context: string;
    timestamp: string;
    location: InvocationLocationInterface & {
        source: string;
    };
}

/**
 * Represents an suite global error message with detailed error information
 *
 * @remarks
 * This interface extends the base MessageInterface to include properties specific to errors,
 * such as error name, message, line and column numbers, stack trace, error code, and
 * formatted code where the error occurred. It provides comprehensive details about
 * an error for debugging purposes.
 *
 * @example
 * ```ts
 * const errorMessage: ErrorMessageInterface = {
 *   suiteName: 'ValidationTests',
 *   runnerName: 'InputValidator',
 *   line: 157,
 *   code: '', // the source code
 *   name: 'ValidationError',
 *   column: 23,
 *   stacks: 'ValidationError: Invalid input\n    at validateInput (validator.ts:157:23)',
 *   message: 'Invalid input: expected string but received number',
 *   formatCode: '' // format (color) source code
 * };
 * ```
 *
 * @see MessageInterface
 *
 * @since 1.0.0
 */

export interface ErrorMessageInterface extends MessageInterface {
    line: number;
    code: string;
    name: string;
    column: number;
    stacks: string;
    message: string;
    formatCode: string;
}

/**
 * Represents a status message providing information about test execution state
 *
 * @remarks
 * This interface extends the base MessageInterface to include properties specific to status reporting,
 * such as kind, status, description, and ancestry path. It provides a comprehensive
 * view of test execution status along with hierarchical context.
 *
 * @example
 * ```ts
 * const statusMessage: StatusMessageInterface = {
 *   suiteName: 'APITests',
 *   runnerName: 'EndpointTester',
 *   kind: 'test',
 *   status: 'failed',
 *   ancestry: ['APITests', 'UserEndpoints', 'GetUserData'],
 *   kindNumber: 2, // KindType.TEST
 *   description: 'Get user data API endpoint',
 *   statusNumber: 3 // StatusType.FAILED
 * };
 * ```
 *
 * @see MessageInterface
 * @see KindType
 * @see StatusType
 *
 * @since 1.0.0
 */

export interface StatusMessageInterface extends MessageInterface {
    kind: string;
    status: string;
    ancestry: Array<string>;
    kindNumber: KindType;
    description: string;
    statusNumber: StatusType;
}

/**
 * Represents an action message with execution details and results
 *
 * @remarks
 * This interface extends the base MessageInterface to include properties specific to actions,
 * such as action type, kind, duration, description, and any errors encountered during execution.
 * It provides comprehensive information about test or task actions including their hierarchical
 * context via the ancestry array.
 *
 * @example
 * ```ts
 * const actionMessage: ActionMessageInterface = {
 *   suiteName: 'UserTests',
 *   runnerName: 'AccountValidator',
 *   kind: 'test',
 *   action: 'run',
 *   errors: [
 *     {
 *       suiteName: 'UserTests',
 *       runnerName: 'AccountValidator',
 *       line: 127,
 *       code: '',
 *       name: 'ValidationError',
 *       column: 15,
 *       stacks: 'ValidationError: Invalid account\n    at validateAccount (validator.ts:127:15)',
 *       message: 'Account validation failed: missing required fields',
 *       formatCode: ''
 *     }
 *   ],
 *   duration: 345,
 *   ancestry: ['UserTests', 'AccountModule', 'ValidateUserAccount'],
 *   kindNumber: 2, // KindType.TEST
 *   description: 'Validate user account details',
 *   actionNumber: 1 // ActionType.RUN
 * };
 * ```
 *
 * @see KindType
 * @see ActionType
 * @see MessageInterface
 * @see ErrorMessageInterface
 *
 * @since 1.0.0
 */

export interface ActionMessageInterface extends MessageInterface {
    kind: string;
    action: string;
    errors: Array<ErrorMessageInterface>;
    duration: number;
    ancestry: Array<string>;
    kindNumber: KindType;
    description: string;
    actionNumber: ActionType;
}
