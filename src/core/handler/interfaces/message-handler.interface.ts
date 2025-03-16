import type { ActionType, LogLevel } from '@core/handler/constants/message-handler.constant';

export type SuiteFinishCallbackType = (id: string) => void;

export interface MessageHandlerInterface {
    type: number;
    suiteId: string;
    runnerId: string;
}

export interface LogMessageInterface {
    level: LogLevel;                // Severity level
    description: string;            // Log message
    data?: unknown;                 // Optional additional data
}

export interface SuiteMessageInterface {
    error?: unknown;
}

export interface ActionMessageInterface {
    action: ActionType;             // Action type
    parents: Array<string>;              // Ancestry path
    description: string;            // Test/describe name or description
    duration?: number;              // Execution time in milliseconds
    errors?: Array<unknown>;         // Array of error details if applicable
    metadata?: {                    // Optional metadata
        location?: {                  // Source location information
            file?: string;
            line?: number;
            column?: number;
        };
        [key: string]: unknown;       // Extensible metadata
    };
}
