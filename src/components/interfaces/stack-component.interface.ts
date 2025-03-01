/**
 * Import will remove at compile time
 */

import type { BaseError } from '@errors/base.error';
import type { ErrorType } from '@errors/interfaces/error.interface';
import type { FrameworkComponent } from '@components/framework.component';

/**
 * Represents the execution context of a stack within the system.
 *
 * @property code - Unique identifier string for the stack context.
 * @property error - Combined error type and base error information.
 * @property framework - Associated framework component instance.
 * @property activeNative - Indicates if native functionality is currently enabled.
 * @property activexJetService - Controls the ActiveX Jet Service state.
 *
 * @remarks
 * This interface provides a comprehensive context structure for stack operations,
 * combining error handling, framework integration, and service states.
 *
 * @see FrameworkComponent
 *
 * @since 1.0.0
 */

export interface StackContextInterface {
    code: string;
    error: ErrorType & BaseError;
    framework: FrameworkComponent
    activeNative: boolean;
    activexJetService: boolean;
}

/**
 * Interface representing an enhanced stack frame with source location details.
 *
 * @property line - The line number in the source file.
 * @property name - The identifier or function name associated with the frame.
 * @property column - The column position in the source file.
 * @property source - The file path or source identifier.
 *
 * @remarks
 * Used for precise location tracking and debugging purposes, providing detailed
 * position information for stack frames.
 *
 * @since 1.0.0
 */

export interface EnhancedFrameInterface {
    line: number;
    name: string;
    column: number;
    source: string;
}
