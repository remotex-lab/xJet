/**
 * Import will remove at compile time
 */

import type { BaseError } from '@errors/base.error';
import type { ErrorType } from '@errors/interfaces/error.interface';
import type { EnhancedFrameInterface, StackContextInterface } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { dirname, join, relative } from 'path';
import { Colors, setColor } from '@components/colors.component';
import { FrameworkComponent } from '@components/framework.component';
import { formatErrorCode, highlightCode, type PositionWithCodeInterface } from '@remotex-labs/xmap';

/**
 * Constants used in stack trace formatting
 * @since 1.0.0
 */

const enum STACK_CONSTANTS {
    TYPE_ERROR = 'TypeError',
    NATIVE_LABEL = '<native>',
    EVAL_MACHINE = 'evalmachine.<anonymous>',
    ANONYMOUS_LABEL = '<anonymous>'
}

/**
 * Constructs and returns the source file path based on the provided frame data and source position information.
 *
 * @param frameObject - The `NodeJS.CallSite` object that contains information about the code frame for which the source map path is being built.
 * @param position - An object that implements the `Required<PositionWithCodeInterface>` interface containing positional
 * details of the source, such as `source`, `sourceRoot`, and `line`.
 * @returns The complete source map path as a string, formatted with line number when applicable.
 *
 * @remarks The method resolves the original source file path referenced in a transpiled file using relative paths and positions.
 *
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 *
 * @since 1.0.0
 */

export function buildSourceMapPath(this: StackContextInterface, frameObject: NodeJS.CallSite, position: Required<PositionWithCodeInterface>): string {
    const filename = (frameObject.getFileName() ?? this.framework.paths.root).replace(/^file:\/\/\//, '');
    const distDirectory = dirname(filename);
    const rootPath = this.framework.getRootDirectory(frameObject.getFileName());
    const filepath = relative(rootPath, join(distDirectory, position.source));

    if (position.sourceRoot)
        return `${ (position.sourceRoot + filepath).replace(/\\/g, '/') }#L${ position.line }`;

    return join(rootPath, filepath);
}

/**
 * Extracts enhanced details from a call site frame
 *
 * @param frame - CallSite object containing stack frame information
 * @returns Enhanced frame details containing line, column, source and name information
 *
 * @remarks
 * Processes NodeJS CallSite objects to extract meaningful debugging information.
 * Handles special cases for native functions and anonymous frames.
 *
 * @since 1.0.0
 */

export function extractEnhancedFrameDetails(frame: NodeJS.CallSite): EnhancedFrameInterface {
    const typeName = frame.getTypeName() || '';
    const functionName = frame.getFunctionName() || '';
    const name = frame.isNative()
        ? STACK_CONSTANTS.NATIVE_LABEL
        : functionName;

    return {
        line: frame.getLineNumber() ?? -1,
        column: frame.getColumnNumber() ?? -1,
        source: frame.getFileName() ?? STACK_CONSTANTS.ANONYMOUS_LABEL,
        name: typeName ? `${ typeName }.${ name }` : name
    };
}

/**
 * Formats a stack trace line with position and color information
 *
 * @param frameObject - CallSite object containing frame information
 * @param frame - Enhanced frame details
 * @returns Formatted error line with color and position
 *
 * @remarks
 * Provides colored output for better readability in terminal environments.
 * Handles special cases for Promise.all and async functions.
 *
 * @since 1.0.0
 */

export function formatErrorLine(frameObject: NodeJS.CallSite, frame: EnhancedFrameInterface): string {
    if (frameObject.isPromiseAll()) {
        return `at async Promise.all (index: ${ frameObject.getPromiseIndex() })`;
    }

    const asyncPrefix = frameObject.isAsync() ? 'async' : '';
    const formattedName = frame.name ? `${ asyncPrefix } ${ frame.name }` : asyncPrefix;
    const position = (frame.line >= 0 && frame.column >= 0) ? setColor(Colors.Gray, `[${ frame.line }:${ frame.column }]`) : '';

    return `at ${ formattedName } ${ setColor(Colors.DarkGray, frame.source) } ${ position }`
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Applies syntax highlighting to source code
 *
 * @param position - Position and code information
 * @returns Code with syntax highlighting applied
 *
 * @remarks
 * Uses color formatting to highlight syntax in the source code snippet.
 * Designed to work with terminal output for better error visualization.
 *
 * @since 1.0.0
 */

export function highlightPositionCode(position: PositionWithCodeInterface): string {
    const highlightedCode = highlightCode(position.code);

    return formatErrorCode({ ...position, code: highlightedCode }, {
        color: Colors.BrightPink,
        reset: Colors.Reset
    });
}


/**
 * Formats an error line with source map information
 *
 * @param frameObject - CallSite object for the current stack frame
 * @param position - Position information with required code context
 * @returns Formatted error line with source map details
 *
 * @remarks
 * Combines source map information with frame details to provide accurate error location.
 * Modifies TypeError messages to include more context when available.
 *
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 *
 * @since 1.0.0
 */

export function formatPositionErrorLine(this: StackContextInterface, frameObject: NodeJS.CallSite, position: Required<PositionWithCodeInterface>): string {
    if (position.name && this.error.name == STACK_CONSTANTS.TYPE_ERROR) {
        this.error.message = this.error.message.replace(/^\S+/, position.name);
    }

    if (!this.code)
        this.code = highlightPositionCode(position);

    return formatErrorLine(frameObject, {
        name: position.name ?? '',
        line: position.line,
        source: buildSourceMapPath.call(this, frameObject, position),
        column: position.column
    });
}

/**
 * Processes and formats a single stack trace entry
 *
 * @param frameObject - CallSite object to process
 * @returns Formatted stack entry or empty string if filtered
 *
 * @remarks
 * Core function for processing individual stack frames.
 * Handles filtering of native and framework-specific frames based on context settings.
 * Supports source map integration for accurate error reporting.
 *
 * @see StackContextInterface
 *
 * @since 1.0.0
 */

export function stackEntry(this: StackContextInterface, frameObject: NodeJS.CallSite): string {
    const isNodeNative = frameObject.getFileName()?.startsWith('node') ?? false;
    const isxJetServiceFile = this.framework.isFrameworkSourceFile(frameObject.getFileName());

    if (
        (!this.activeNative && isNodeNative) ||
        (isxJetServiceFile && !this.activexJetService)
    ) return '';

    let position: PositionWithCodeInterface | null = null;
    const frame = extractEnhancedFrameDetails(frameObject);
    if (isxJetServiceFile)
        position = this.framework.sourceMap.getPositionWithCode(frame.line, frame.column);
    else if (this.error.sourceMap)
        position = this.error.sourceMap.getPositionWithCode(frame.line, frame.column);

    if (position)
        return formatPositionErrorLine.call(this, frameObject, position);

    if (frameObject.getFileName() === STACK_CONSTANTS.EVAL_MACHINE && !frameObject.getFunctionName())
        return '';

    return formatErrorLine(frameObject, frame);
}

/**
 * Creates a formatted stack trace with enhanced debugging information
 *
 * @param error - Error object containing base error information
 * @param frames - Array of CallSite objects representing the stack
 * @param activexJetService - Flag to include xJet service frames
 * @param activeNative - Flag to include native frames
 * @returns Formatted stack trace with enhanced information
 *
 * @throws Error - When an error object or frames are invalid
 *
 * @remarks
 * Main entry point for stack trace formatting.
 * Provides rich error information including
 * - Syntax highlighted code snippets
 * - Source map integration
 * - Framework-aware stack filtering
 * - Colored terminal output
 *
 * @example
 * ```typescript
 * const error = new Error ('Sample error');
 * const frames = Error.prepareStackTrace(error, error.callStacks);
 * const formattedStack = formatStacks(
 *     error as ErrorType & BaseError,
 *     frames,
 *     true, // include xJet service frames
 *     false // exclude native frames
 * );
 * console.log(formattedStack);
 * ```
 *
 * @since 1.0.0
 */

export function formatStacks(error: ErrorType & BaseError, frames: Array<NodeJS.CallSite>, activexJetService = false, activeNative = false): string {
    const context: StackContextInterface = {
        code: '',
        error,
        framework: FrameworkComponent.getInstance(),
        activeNative,
        activexJetService
    };

    const stacks: Array<string> = frames
        .map(frame => stackEntry.call(context, frame))
        .filter(Boolean);

    let formattedError = `\n${ error.name }: \n${ setColor(Colors.LightCoral, error.message) }\n\n`;
    if (context.code)
        formattedError += `${ context.code }\n\n`;

    if (stacks.length > 0)
        formattedError += `Enhanced Stack Trace:\n${ stacks.join('\n') }\n`;

    return formattedError;
}
