/**
 * Import will remove at compile time
 */

import type { SchemaType } from '@schema/constants/action-schema.constants';
import type { LogLevel } from '@shared/components/constants/log-component.constants';
import type { ActionType, KindType, StatusType } from '@handler/constants/message-handler.constant';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Interface defining the header structure for all schema messages
 *
 * @since 1.0.0
 */

export interface HeaderSchemaInterface {
    /**
     * The type of schema message
     *
     * @see SchemaType
     * @since 1.0.0
     */

    type: SchemaType;

    /**
     * Unique identifier of the test suite
     * @since 1.0.0
     */

    suiteId: string;

    /**
     * Unique identifier of the test runner
     * @since 1.0.0
     */

    runnerId: string;
}

/**
 * Interface defining the structure for error information
 * @since 1.0.0
 */

export interface ErrorSchemaInterface {
    /**
     * Error message string or serialized error information
     * @since 1.0.0
     */

    error: string;
}

/**
 * Interface defining the structure of log messages
 * @since 1.0.0
 */

export interface LogSchemaInterface {
    /**
     * Log level indicator
     * @since 1.0.0
     */

    level: LogLevel;

    /**
     * Log context (describe or test) description
     */

    context: string;

    /**
     * ISO 8601 formatted timestamp that marks when the log entry was created
     * @since 1.0.0
     */

    timestamp: string;

    /**
     * Descriptive message for the log entry
     * @since 1.0.0
     */

    description: string;

    /**
     * Source location information
     *
     * @see InvocationLocationInterface
     * @since 1.0.0
     */

    location?: InvocationLocationInterface;
}

/**
 * Interface defining the structure for status information in test reporting
 *
 * @since 1.0.0
 */

export interface StatusSchemaInterface {
    /**
     * Kind of action like (TEST, DESCRIBE, HOOK)
     * @since 1.0.0
     */

    kind: KindType;

    /**
     * Action type identifier like (START, SKIP, TO-DO)
     * @since 1.0.0
     */

    action: StatusType;

    /**
     * Parent describe in serialized format
     * @since 1.0.0
     */

    ancestry: string;

    /**
     * Description of the action (test/describe name)
     * @since 1.0.0
     */

    description: string;
}

/**
 * Interface defining the structure of action messages
 * @since 1.0.0
 */

export interface ActionSchemaInterface extends Omit<StatusSchemaInterface, 'action'> {
    /**
     * Action type identifier like (FAILURE, SUCCESS)
     * @since 1.0.0
     */

    action: ActionType;

    /**
     * Optional error information
     * @since 1.0.0
     */

    errors?: string;

    /**
     * Duration of the action in milliseconds
     * @since 1.0.0
     */

    duration?: number;

    /**
     * Optional source location information
     *
     * @see InvocationLocationInterface
     * @since 1.0.0
     */

    location?: InvocationLocationInterface;
}

/**
 * Union type representing all possible schema interfaces
 *
 * @see LogSchemaInterface
 * @see ErrorSchemaInterface
 * @see ActionSchemaInterface
 * @see StatusSchemaInterface
 *
 * @since 1.0.0
 */

export type SchemaInterface =
    | LogSchemaInterface
    | ErrorSchemaInterface
    | ActionSchemaInterface
    | StatusSchemaInterface;

/**
 * Maps a schema type to its corresponding interface
 *
 * @template T - The schema type to map
 * @since 1.0.0
 */

export type SchemaTypeToInterface<T extends SchemaType> = {
    [SchemaType.LOG]: LogSchemaInterface;
    [SchemaType.ERROR]: ErrorSchemaInterface;
    [SchemaType.STATUS]: StatusSchemaInterface;
    [SchemaType.ACTION]: ActionSchemaInterface;
}[T] | never;

/**
 * Combines a header schema with another schema type to form a complete message
 *
 * @template T - The schema interface type to combine with the header
 *
 * @see HeaderSchemaInterface
 * @since 1.0.0
 */

export type MessageType<T> = HeaderSchemaInterface & T;

/**
 * Creates a type where all properties from HeaderSchemaInterface and the generic type T are required
 *
 * @template T - The schema interface type to combine with the header and make required
 *
 * @see HeaderSchemaInterface
 * @since 1.0.0
 */

export type RequiredMessageType<T> = Required<HeaderSchemaInterface & T>;
