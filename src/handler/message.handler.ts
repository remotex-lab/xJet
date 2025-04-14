/**
 * Import will remove at compile time
 */

import type {
    LogSchemaInterface,
    RequiredMessageType,
    ErrorSchemaInterface,
    ActionSchemaInterface,
    StatusSchemaInterface
} from '@schema/interfaces/action-schema.interface';

import type {
    LogType,
    MessageInterface,
    EnhancedErrorType,
    LogMessageInterface,
    ErrorMessageInterface,
    ActionMessageInterface,
    StatusMessageInterface
} from '@handler/interfaces/message-handler.interface';
import type { BaseTarget } from '@targets/base.target';
import type { SourceService } from '@remotex-labs/xmap';
import type { AbstractReporter } from '@reports/abstract.reporter';
import type { ErrorResultInterface } from '@components/interfaces/stack-component.interface';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { dirname, join, relative } from 'path';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { LogLevel } from '@shared/components/constants/log-component.constants';
import { getStackMetadata, highlightPositionCode } from '@components/stack.component';
import { ActionType, KindType, StatusType } from '@handler/constants/message-handler.constant';

/**
 * Handles log messages from the test runner.
 *
 * @param data - The log data containing level, description, and timestamp.
 * @param source - The source service that generated the log.
 *
 * @returns Nothing is returned from this method.
 *
 * @example
 * ```ts
 * messageHandler.handleLog({
 *   level: 1,
 *   description: 'Test started',
 *   timestamp: Date.now()
 * }, sourceService);
 * ```
 *
 * @see AbstractReporter
 * @since 1.0.0
 */

export class MessageHandler {
    /**
     * The root directory path used for resolving relative file paths.
     *
     * @since 1.0.0
     */

    private readonly root: string;

    /**
     * Creates a new instance of the MessageHandler.
     *
     * @param target - The base target that will receive processed messages
     * @param reporter - The reporter responsible for formatting and outputting messages
     *
     * @see BaseTarget
     * @see AbstractReporter
     * @since 1.0.0
     */

    constructor(private readonly target: BaseTarget, private readonly reporter: AbstractReporter) {
        this.root = process.env.INIT_CWD || process.cwd();
    }

    /**
     * Processes and logs pending test suite paths.
     *
     * @param paths - Array of absolute file paths representing pending test suites
     * @param runnerCount - The number of assigned runners. A value of -1 indicates a local runner.
     *
     * @remarks
     * This method converts absolute paths to relative paths based on the root directory
     * and logs them to the console for debugging purposes.
     *
     * @example
     * ```ts
     * messageHandler.handlePendingSuite([
     *   '/home/user/project/tests/suite1.test.ts',
     *   '/home/user/project/tests/suite2.test.ts'
     * ]);
     * ```
     *
     * @since 1.0.0
     */

    handlePendingSuite(paths: Array<string>, runnerCount: number): void {
        const relativePaths = paths.map(path => relative(this.root, path));
        this.reporter?.init?.(relativePaths, runnerCount);
    }

    /**
     * Processes log messages and sends them to the reporter.
     *
     * @param data - The log message data containing level, description, and timestamp
     * @param source - The source service that generated the log message
     * @returns Nothing is returned from this method
     *
     * @remarks
     * This method transforms the raw log data into a standardized LogMessageInterface format
     * before passing it to the reporter. It combines base message properties with log-specific
     * properties like type, value, and timestamp.
     *
     * @example
     * ```ts
     * messageHandler.handleLog({
     *   level: 2,
     *   description: "Test execution started",
     *   timestamp: 1634567890123
     * }, sourceService);
     * ```
     *
     * @see AbstractReporter
     * @see LogMessageInterface
     *
     * @since 1.0.0
     */

    handleLog(data: RequiredMessageType<LogSchemaInterface>, source: SourceService): void {
        const position = source.getPosition(data.location.line, data.location.column);
        const path = join(dirname(this.getFilepath(source)), position?.source ?? '');

        const log: LogMessageInterface = {
            ...this.createBaseMessage(data, source),
            type: LogLevel[data.level].toLowerCase() as LogType,
            value: data.description,
            context: data.context,
            location: {
                line: position?.line ?? 0,
                column: position?.column ?? 0,
                source: path
            },
            timestamp: data.timestamp
        };

        this.reporter?.log?.(log);
    }

    /**
     * Processes test suite errors and marks the suite as complete with failure.
     *
     * @param data - The error message data containing error details and suite identification
     * @param source - The source service that generated the error message
     * @returns Nothing is returned from this method
     *
     * @throws ParseError - If the error data cannot be properly parsed
     *
     * @remarks
     * This method parses the error information from the raw data, marks the associated
     * test suite as complete with a failure status, and reports the error through the
     * configured reporter.
     *
     * @example
     * ```ts
     * messageHandler.handleSuiteError({
     *   suiteId: "suite-123",
     *   error: JSON.stringify({ message: "Test suite failed", stack: "..." }),
     *   runnerId: "runner-456"
     * }, sourceService);
     * ```
     *
     * @see BaseTarget
     * @see AbstractReporter
     * @see EnhancedErrorType
     *
     * @since 1.0.0
     */

    handleSuiteError(data: RequiredMessageType<ErrorSchemaInterface>, source: SourceService): void {
        const error = this.parseError(
            this.safeJsonParse<EnhancedErrorType>(data.error),
            source,
            data.runnerId
        );

        this.target.completeSuite(data.suiteId, true);
        this.reporter?.suiteError?.(error);
    }

    /**
     * Processes test suite status updates and manages suite lifecycle events.
     *
     * @param data - The status message data containing action, suite ID, ancestry, and description
     * @param source - The source service that generated the status message
     * @returns Nothing is returned from this method
     *
     * @remarks
     * This method handles various status types for test suites, including start, end, skip, and todo states.
     * When an END status is received, it marks the suite as complete in the target.
     * All status messages are transformed into a standardized StatusMessageInterface format
     * and passed to the reporter.
     *
     * @example
     * ```ts
     * messageHandler.handleSuiteStatus({
     *   action: StatusType.END,
     *   suiteId: "suite-123",
     *   kind: KindType.SUITE,
     *   ancestry: JSON.stringify(["parent-suite"]),
     *   description: "Test suite completed"
     * }, sourceService);
     * ```
     *
     * @see KindType
     * @see StatusType
     * @see BaseTarget
     * @see StatusMessageInterface
     *
     * @since 1.0.0
     */

    handleSuiteStatus(data: RequiredMessageType<StatusSchemaInterface>, source: SourceService): void {
        if (data.action === StatusType.END) {
            this.target.completeSuite(data.suiteId);
        }

        // Handle all other status types (SKIP, TODO, START)
        const status: StatusMessageInterface = {
            ...this.createBaseMessage(data, source),
            kind: KindType[data.kind].toLowerCase(),
            status: StatusType[data.action].toLowerCase(),
            ancestry: this.safeJsonParse(data.ancestry, []),
            kindNumber: data.kind,
            description: data.description,
            statusNumber: data.action
        };

        this.reporter?.status?.(status);
    }

    /**
     * Processes suite action data and reports it to the reporter.
     *
     * @param data - The action data with required message fields
     * @param source - The source service containing file information
     *
     * @remarks
     * This method transforms raw action data into a standardized action message,
     * processes any errors, and forwards the complete action to the reporter.
     * Error handling includes special cases for xJet-specific errors.
     *
     * @example
     * ```ts
     * this.handleSuiteAction(actionData, sourceService);
     * ```
     *
     * @see ActionMessageInterface
     * @see RequiredMessageType
     * @see ActionSchemaInterface
     * @internal
     * @since 1.0.0
     */

    handleSuiteAction(data: RequiredMessageType<ActionSchemaInterface>, source: SourceService): void {
        // Create base action message with transformed properties
        const action: ActionMessageInterface = {
            ...this.createBaseMessage(data, source),
            kind: KindType[data.kind].toLowerCase(),
            action: ActionType[data.action].toLowerCase(),
            errors: [],
            duration: data.duration,
            ancestry: this.safeJsonParse(data.ancestry, []),
            kindNumber: data.kind,
            description: data.description ?? this.getFilepath(source),
            actionNumber: data.action
        };

        // Process errors if present
        if (data.errors) {
            const errors = this.safeJsonParse<Array<EnhancedErrorType>>(data.errors, []);
            action.errors = errors.map((error: EnhancedErrorType) => this.processError(error, source, data));
        }

        // Report the completed action
        this.reporter?.action?.(action);
    }

    /**
     * Processes an error based on its type and available location information.
     *
     * @param error - The enhanced error object to process
     * @param source - The source service containing file information
     * @param data - The action data with runner ID and location info
     * @returns A processed error message interface
     *
     * @private
     */

    private processError(error: EnhancedErrorType, source: SourceService, data: RequiredMessageType<ActionSchemaInterface>): ErrorMessageInterface {
        // Handle special xJet error types
        if (error.name === 'xJetFailingError' || error.name === 'xJetTimeoutError') {
            // Use error's location if available
            if (error.location) {
                return this.parseError(error, source, data.runnerId, error.location);
            }

            // Fall back to data location if valid
            if (data.location?.line > 0 && data.location?.column > 1) {
                return this.parseError(error, source, data.runnerId, data.location);
            }
        }

        // Default case: no specific location info
        return this.parseError(error, source, data.runnerId);
    }

    /**
     * Creates a base message structure with common attributes.
     *
     * @param data - The raw message data containing at minimum a runner ID
     * @param source - The source service that generated the message
     * @returns A base message object with suite name and runner name
     *
     * @remarks
     * This private helper method establishes the common fields needed for all message types
     * by extracting file path information from the source and resolving the runner name
     * using the target.
     *
     * @example
     * ```ts
     * const baseMessage = this.createBaseMessage(messageData, sourceService);
     * const completeMessage = {
     *   ...baseMessage,
     *   additionalData: "value"
     * };
     * ```
     * @internal
     * @see SourceService
     * @see MessageInterface
     *
     * @since 1.0.0
     */

    private createBaseMessage(data: RequiredMessageType<unknown>, source: SourceService): MessageInterface {
        return {
            suiteName: this.getFilepath(source),
            runnerName: this.target.getRunnerName(data.runnerId)
        };
    }

    /**
     * Safely parses a JSON string with fallback for error cases.
     *
     * @template T - The expected type of the parsed JSON result
     * @param jsonString - The JSON string to be parsed
     * @param fallback - The fallback value to return if parsing fails
     * @returns The parsed JSON object or the fallback value if parsing fails
     *
     * @throws VMRuntimeError - Logs but doesn't throw; captures JSON parse errors
     *
     * @remarks
     * This private utility method attempts to parse a JSON string and returns a typed result.
     * If parsing fails, it logs the error wrapped in a VMRuntimeError and returns the provided fallback value.
     *
     * @example
     * ```ts
     * const ancestry = this.safeJsonParse<string[]>(data.ancestry, []);
     * const error = this.safeJsonParse<ErrorDetails>(data.error);
     * ```
     * @internal
     * @see VMRuntimeError
     *
     * @since 1.0.0
     */

    private safeJsonParse<T>(jsonString: string, fallback: T = {} as T): T {
        try {
            return JSON.parse(jsonString) as T;
        } catch (error) {
            console.log(new VMRuntimeError(<Error> error));

            return fallback;
        }
    }

    /**
     * Parses error information and generates a standardized error message object.
     *
     * @param error - The enhanced error object containing error details
     * @param source - The source service that provides code location information
     * @param runnerId - The ID of the runner that encountered the error
     * @param location - Optional invocation location information for precise error positioning
     * @returns A standardized error message interface with location and stack information
     *
     * @remarks
     * This method processes raw error information into a consistent format, enriching it with
     * stack trace details, code snippets, and position information. It handles two scenarios:
     * 1. When location is provided, it extracts position and code directly from the source
     * 2. When no location is provided, it relies on stack metadata extraction
     *
     * @example
     * ```ts
     * const errorMessage = this.parseError(
     *   { name: "TestError", message: "Test failed", stack: "..." },
     *   sourceService,
     *   "runner-123",
     *   { line: 42, column: 10 }
     * );
     * ```
     *
     * @internal
     * @see EnhancedErrorType
     * @see ErrorResultInterface
     * @see ErrorMessageInterface
     * @see InvocationLocationInterface
     *
     * @since 1.0.0
     */

    private parseError(error: EnhancedErrorType, source: SourceService, runnerId: string, location?: InvocationLocationInterface): ErrorMessageInterface {
        let stack: ErrorResultInterface;
        if(location) {
            const position = source.getPositionWithCode(location.line, location.column)!;
            stack = {
                line: position.line,
                code: position.code ?? '',
                column: position.column,
                stacks: '',
                formatCode: highlightPositionCode(position)
            };
        } else {
            stack = getStackMetadata({ sourceMap: source, ...error });
        }

        return {
            ...stack,
            name: error.name,
            message: error.message,
            suiteName: this.getFilepath(source),
            runnerName: this.target.getRunnerName(runnerId)
        };
    }

    /**
     * Retrieves the relative file path from the source service.
     *
     * @param source - The source service containing the file information
     * @returns A string representing the relative path from the root to the source file, or an empty string if no file exists
     *
     * @remarks
     * This method normalizes file paths by converting absolute paths to paths relative to the configured root directory.
     * It handles cases where the source may not have an associated file by returning an empty string.
     *
     * @example
     * ```ts
     * const filePath = this.getFilepath(sourceService);
     * // Returns something like: "test/unit/auth/login.test.js"
     * ```
     *
     * @internal
     * @see SourceService
     *
     * @since 1.0.0
     */

    private getFilepath(source: SourceService): string {
        return source.file ? relative(this.root, source.file) : '';
    }
}
