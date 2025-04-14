/**
 * Import will remove at compile time
 */

import type { EmitActionEventType, EmitStatusEventType } from './interfaces/emit-service.interface';
import type { ActionInterface, StatusInterface } from '@handler/interfaces/message-handler.interface';

/**
 * Imports
 */

import { encodeSchema } from '@schema/action.schema';
import { errorReplacer } from '@components/json.component';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Emits a status event with the specified type and notification details
 *
 * @param type - The status event type to emit, excluding completion states
 * @param notification - The status notification containing event details
 *
 * @throws DispatchError - When the dispatch operation fails
 *
 * @remarks
 * This function converts the notification to a schema-compliant structure before dispatching.
 * The ancestry field is serialized to JSON as part of this process.
 *
 * @example
 * ```ts
 * emitStatus(StatusType.START, {
 *   kind: 'process',
 *   ancestry: ['parent1', 'parent2'],
 *   description: 'Process started'
 * });
 * ```
 *
 * @see SchemaType - Enum containing available schema types
 * @see EmitStatusEventType - The type of status events that can be emitted
 * @see StatusInterface - The structure of status messages
 *
 * @since 1.0.0
 */

export function emitStatus(type: EmitStatusEventType, notification: StatusInterface): void {
    dispatch(encodeSchema(SchemaType.STATUS, {
        action: type,
        kind: notification.kind,
        ancestry: JSON.stringify(notification.ancestry),
        description: notification.description
    }));
}

/**
 * Emits an action event with the specified type and notification details
 *
 * @param type - The action event type to emit, excluding preparatory states
 * @param notification - The action notification containing event details
 *
 * @throws DispatchError - When the dispatch operation fails
 *
 * @remarks
 * This function converts the notification to a schema-compliant structure before dispatching.
 * Any errors present in the notification are processed through the errorReplacer function to ensure
 * they can be properly serialized. The ancestry and errors fields are serialized to JSON as part
 * of this process.
 *
 * @example
 * ```ts
 * emitAction(ActionType.SUCCESS, {
 *   kind: 'process',
 *   ancestry: ['parent1', 'parent2'],
 *   location: 'main.process',
 *   duration: 500,
 *   description: 'Process completed successfully'
 * });
 * ```
 *
 * @see SchemaType - Enum containing available schema types
 * @see EmitActionEventType - The type of action events that can be emitted
 * @see ActionInterface - The structure of action messages
 *
 * @since 1.0.0
 */

export function emitAction(type: EmitActionEventType, notification: ActionInterface): void {
    const stringErrors = notification.errors?.map(error =>
        errorReplacer('', error)
    ) || [];

    dispatch(encodeSchema(SchemaType.ACTION, {
        kind: notification.kind,
        action: type,
        errors: JSON.stringify(stringErrors),
        ancestry: JSON.stringify(notification.ancestry),
        location: notification.location,
        duration: notification.duration,
        description: notification.description
    }));
}
