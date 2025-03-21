/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { FrameworkProvider } from '@providers/framework.provider';

/**
 * Represents an extended error type with optional source mapping
 * and call stack information for enhanced debugging capabilities.
 *
 * @see SourceService
 * @see NodeJS.CallSite
 * @since 1.0.0
 */

export type ErrorType = Error & {
    sourceMap?: SourceService,
    callStacks?: Array<NodeJS.CallSite>
};

/**
 * Defines the context information required for stack trace processing and analysis.
 * Contains the original code, error details, framework reference, and processing options.
 *
 * @see ErrorType
 * @see FrameworkProvider
 * @since 1.0.0
 */

export interface StackContextInterface {
    code: string;
    error: ErrorType;
    framework: FrameworkProvider;
    activeNative: boolean;
    includeFramework: boolean;
}
