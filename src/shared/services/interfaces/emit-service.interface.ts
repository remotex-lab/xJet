/**
 * Import will remove at compile time
 */

import type { ActionType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Represents event types that can be emitted for status reporting, excluding completion states
 *
 * @see StatusType - The original enum containing all possible action types
 * @since 1.0.0
 */

export type EmitStatusEventType = StatusType;

/**
 * Represents event types that can be emitted for completed actions, excluding preparatory states
 *
 * @see ActionType - The original enum containing all possible action types
 * @since 1.0.0
 */

export type EmitActionEventType = ActionType;
