/**
 * Import will remove at compile time
 */

import type { StackFrame } from '@remotex-labs/xmap/parser.component';
import type { PositionWithCodeInterface, SourceOptionsInterface } from '@remotex-labs/xmap';
import type { ErrorResultInterface, StackContextInterface } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { dirname, join, normalize, relative } from 'path';
import { Colors, setColor } from '@components/colors.component';
import { FrameworkProvider } from '@providers/framework.provider';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';

/**
 * Constants used for stack trace processing and error handling
 *
 * @remarks
 * These constants identify specific error types and evaluation contexts
 * that require special handling during stack trace analysis
 *
 * @internal
 * @since 1.0.0
 */

const enum STACK_CONSTANTS {
    TYPE_ERROR = 'TypeError',
    EVAL_MACHINE = 'evalmachine.<anonymous>'
}

/**
 * Highlights code at a specific position and formats it for error display
 *
 * @param position - The position information that contains code to be highlighted
 * @returns A formatted string with the highlighted code
 *
 * @remarks
 * This function first applies syntax highlighting to the code using `highlightCode`,
 * then formats it as error output with appropriate color styling.
 *
 * @example
 * ```ts
 * const position: PositionWithCodeInterface = {
 *     name: '',
 *     code: 'const x = 5;',
 *     line: 1,
 *     source: '',
 *     column: 8,
 *     endLine: 1,
 *     startLine: 1,
 *     sourceRoot: '',
 *     sourceIndex: 0,
 *     generatedLine: 1,
 *     generatedColumn: 0
 * };
 *
 * const highlighted = highlightPositionCode(position);
 * console.log(highlighted);
 * ```
 *
 * @see highlightCode
 * @see formatErrorCode
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
 * Formats a stack frame into a human-readable error line with color highlighting
 *
 * @param frame - The stack frame to format
 * @returns A formatted string representation of the stack frame
 *
 * @remarks
 * The function creates error lines similar to standard Node.js stack traces but with
 * color enhancements. It includes function name, filename with gray coloring, and
 * line:column information in parentheses when available. Extra whitespace is trimmed
 * for consistent formatting.
 *
 * @example
 * ```ts
 * const frame: StackFrame = {
 *     line: 42,
 *     column: 8,
 *     source: '',
 *     eval: false,
 *     async: false,
 *     native: false,
 *     constructor: false,
 *     functionName: 'processData',
 *     fileName: '/src/utils/data.ts'
 * };
 *
 * const formattedLine = formatErrorLine(frame);
 * console.error(formattedLine);
 * ```
 *
 * @see setColor
 * @see StackFrame
 *
 * @since 1.0.0
 */

export function formatErrorLine(frame: StackFrame): string {
    if(frame.fileName?.includes(FrameworkProvider.getInstance().paths.root)) {
        frame.fileName = relative(FrameworkProvider.getInstance().paths.root, frame.fileName);
    }

    const position = (frame.line && frame.column) ? setColor(Colors.Gray, `[${ frame.line }:${ frame.column }]`) : '';
    if (!frame.fileName) {
        return `${ frame.source ?? '' }`;
    }

    return `at ${ frame.functionName ?? '' } ${ setColor(Colors.DarkGray, frame.fileName) } ${ position }`
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Builds a source map path from a stack frame and position information
 *
 * @param frame - The stack frame containing filename information
 * @param position - The position information with source map details
 * @returns A formatted path to the original source file
 *
 * @remarks
 * This function resolves the original source file path from compiled code using source map information.
 * It handles relative paths, URLs, and project root directories to create proper source links.
 * For web URLs, it adds a line number suffix using the hash notation.
 *
 * @example
 * ```ts
 * const frame: StackFrame = {
 *     line: 10,
 *     column: 5,
 *     source: '',
 *     eval: false,
 *     async: false,
 *     native: false,
 *     constructor: false,
 *     fileName: '/dist/app.js'
 * };
 *
 * const position: PositionWithCodeInterface = {
 *     source: 'app.ts',
 *     line: 8,
 *     column: 3,
 *     code: 'const x = 5;',
 *     sourceRoot: '/src/',
 *     endLine: 8,
 *     startLine: 8,
 *     name: '',
 *     sourceIndex: 0,
 *     generatedLine: 10,
 *     generatedColumn: 5
 * };
 *
 * const sourcePath = buildSourceMapPath.call(context, frame, position);
 * console.error(sourcePath);
 * ```
 *
 * @see StackFrame
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 *
 * @since 1.0.0
 */

export function buildSourceMapPath(this: StackContextInterface, frame: StackFrame, position: Required<PositionWithCodeInterface>): string {
    if (position.source && /^https?:\/\//.test(position.source)) {
        return `${ position.source }#L${ position.line }`;
    }

    const filename = frame.fileName ? frame.fileName.replace(/^file:\/\//, '') : undefined;
    const frameDirectoryPath = filename ? dirname(filename) : FrameworkProvider.getInstance().paths.root;
    const projectRootPath = FrameworkProvider.getInstance().getRootDirectory(filename ?? '');
    const relativeSourcePath = relative(projectRootPath, join(frameDirectoryPath, position.source));

    if (position.sourceRoot) {
        return `${ (position.sourceRoot + relativeSourcePath).replace(/\\/g, '/') }#L${ position.line }`;
    }

    return relativeSourcePath;
}

/**
 * Formats a stack frame with enhanced source map position information
 *
 * @param context - The stack context containing error and code information
 * @param frame - The stack frame to format
 * @param position - The source map position information with original source details
 * @returns A formatted error line with source map information
 *
 * @remarks
 * This function enhances error messages with source map data, providing more accurate
 * error reporting by showing original source locations instead of compiled positions.
 * It also:
 * - Updates error names for TypeError instances
 * - Sets context code with syntax highlighting if not already present
 * - Combines frame and position data for complete error information
 *
 * @example
 * ```ts
 * const context: StackContextInterface = {
 *     error: new TypeError('undefined is not a function'),
 *     code: '',
 *     activeNative: false,
 *     includeFramework: false
 * };
 *
 * const frame: StackFrame = {
 *     line: 42,
 *     column: 12,
 *     source: '',
 *     eval: false,
 *     async: false,
 *     native: false,
 *     constructor: false,
 *     fileName: '/dist/app.js',
 *     functionName: 'processData'
 * };
 *
 * const position: Required<PositionWithCodeInterface> = {
 *     source: 'app.ts',
 *     line: 36,
 *     column: 8,
 *     code: 'user.process()',
 *     name: 'User.process',
 *     sourceRoot: '/src/',
 *     endLine: 36,
 *     startLine: 36,
 *     sourceIndex: 0,
 *     generatedLine: 42,
 *     generatedColumn: 12
 * };
 *
 * const formattedLine = formatPositionErrorLine(context, frame, position);
 * console.error(formattedLine);
 * ```
 *
 * @see StackFrame
 * @see formatErrorLine
 * @see buildSourceMapPath
 * @see highlightPositionCode
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 *
 * @since 1.0.0
 */

export function formatPositionErrorLine(context: StackContextInterface, frame: StackFrame, position: Required<PositionWithCodeInterface>): string {
    if (position.name && context.error.name == STACK_CONSTANTS.TYPE_ERROR) {
        context.error.message = context.error.message.replace(/^\S+/, position.name);
    }

    if (!context.code) {
        context.code = position.code;
        context.formatCode = highlightPositionCode(position);
    }

    return formatErrorLine({
        ...frame,
        line: position.line,
        column: position.column,
        functionName: position.name ?? frame.functionName,
        fileName: buildSourceMapPath.call(context, frame, position)
    });
}

/**
 * Processes a single stack frame and formats it as a readable error line
 *
 * @param context - The stack context containing error and formatting settings
 * @param frame - The stack frame to process and format
 * @param options - Configuration for the amount of surrounding lines
 * @returns A formatted error line string or empty string if the frame should be filtered out
 *
 * @remarks
 * This function processes individual stack frames to create readable error lines with
 * proper source mapping when available. It performs several key operations:
 * - Normalizes file paths
 * - Filters out native Node.js frames when not explicitly requested
 * - Filters out framework internal files based on configuration
 * - Applies source mapping to display original source positions
 * - Handles special cases like eval frames
 *
 * The function returns an empty string for frames that should be excluded from the stack trace.
 *
 * @example
 * ```ts
 * const context: StackContextInterface = {
 *   error: new Error('Something went wrong'),
 *   code: '',
 *   activeNative: false,
 *   includeFramework: true
 * };
 *
 * // Add source map to error if available
 * context.error.sourceMap = createSourceMap('/path/to/sourcemap.map');
 *
 * const frame: StackFrame = {
 *     line: 42,
 *     column: 12,
 *     source: '',
 *     eval: false,
 *     async: false,
 *     native: false,
 *     constructor: false,
 *     fileName: '/dist/app.js',
 *     functionName: 'processData'
 * };
 *
 * const formattedLine = stackEntry(context, frame);
 * console.error(formattedLine);
 * ```
 *
 * @see StackFrame
 * @see formatErrorLine
 * @see formatPositionErrorLine
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 *
 * @since 1.0.0
 */

export function stackEntry(context: StackContextInterface, frame: StackFrame, options?: SourceOptionsInterface): string {
    frame.fileName = frame.fileName ? normalize(frame.fileName) : undefined;
    const isNodeNative = (frame.fileName ?? '').startsWith('node') ?? false;
    const isxJetServiceFile = FrameworkProvider.getInstance().isFrameworkSourceFile(frame.fileName ?? undefined);

    if (
        (!context.activeNative && isNodeNative) ||
        (isxJetServiceFile && !context.includeFramework)
    ) return '';

    let position: PositionWithCodeInterface | null = null;
    if (isxJetServiceFile)
        position = FrameworkProvider.getInstance().getFrameworkSourceMap(frame.fileName ?? undefined)
            .getPositionWithCode(frame.line ?? 0, frame.column ?? 0, 0, options);
    else if (context.error.sourceMap)
        position = context.error.sourceMap
            .getPositionWithCode(frame.line ?? 0, frame.column ?? 0, 0, options);

    if (position) {
        const isShared = FrameworkProvider.getInstance().isSharedSourceFile(position.source);
        if(isShared && !context.includeFramework) return '';
        context.line = position.line;
        context.column = position.column;

        return formatPositionErrorLine(context, frame, position);
    }

    if (frame.fileName === STACK_CONSTANTS.EVAL_MACHINE && !frame.functionName)
        return '';

    if( !frame.line && !frame.column && !frame.fileName && !frame.functionName )
        return '';

    return formatErrorLine(frame);
}

/**
 * Formats an error object into an enhanced, readable stack trace with syntax highlighting
 *
 * @param error - The error object to format
 * @param includeFramework - Whether to include framework internal files in the stack trace (defaults to false)
 * @param activeNative - Whether to include native Node.js calls in the stack trace (defaults to false)
 * @returns A formatted and colored string representation of the error with enhanced stack trace
 *
 * @remarks
 * This function transforms standard JavaScript Error objects into richly formatted
 * stack traces with:
 * - Syntax highlighting for code snippets
 * - Source mapping to original source locations
 * - Configurable filtering of framework and native code
 * - Colorized output for better readability
 *
 * The resulting stack trace provides significantly more context than standard
 * JavaScript errors, making debugging easier and more efficient.
 *
 * @example
 * ```ts
 * try {
 *   // Some code that throws an error
 *   JSON.parse('{invalid}');
 * } catch (error) {
 *   if (error instanceof Error) {
 *     // Format with default settings (no framework or native code)
 *     console.log(formatStack(error));
 *
 *     // Include framework internal calls
 *     console.log(formatStack(error, true));
 *
 *     // Include both framework and native calls
 *     console.log(formatStack(error, true, true));
 *   }
 * }
 * ```
 *
 * @see stackEntry
 * @see parseErrorStack
 * @see StackContextInterface
 *
 * @since 1.0.0
 */

export function formatStack(error: Error, includeFramework = false, activeNative = false): string {
    const context: StackContextInterface = {
        code: '',
        error,
        activeNative,
        formatCode: '',
        includeFramework
    };

    const stacks: Array<string> = parseErrorStack(error).stack
        .map(frame => stackEntry(context, frame))
        .filter(Boolean);

    let formattedError = `\n${ error.name }: \n${ setColor(Colors.LightCoral, error.message) }\n\n`;
    if (context.formatCode)
        formattedError += `${ context.formatCode }\n\n`;

    if (stacks.length > 0)
        formattedError += `Enhanced Stack Trace:\n${ stacks.join('\n') }\n`;

    return formattedError;
}

/**
 * Extracts and formats error stack metadata from an Error object
 *
 * @param error - The Error object to extract stack information from
 * @param includeFramework - Whether to include framework-related stack frames in the result
 * @param activeNative - Whether to activate native code stack frames in the result
 * @returns Formatted error result with code context, position information, and formatted stack trace
 *
 * @remarks
 * This function parses an Error's stack trace and formats it for display, providing
 * contextual code snippets around each error location. The stack frames are processed
 * with line and column information, and unwanted frames can be filtered based on parameters.
 *
 * @example
 * ```ts
 * try {
 *   // Code that might throw an error
 *   throw new Error("Something went wrong");
 * } catch (error) {
 *   const stackInfo = getStackMetadata(error, false, true);
 *   console.error(stackInfo.stacks);
 * }
 * ```
 *
 * @see stackEntry
 * @see parseErrorStack
 * @see ErrorResultInterface
 * @see StackContextInterface
 *
 * @since 1.0.0
 */

export function getStackMetadata(error: Error, includeFramework = false, activeNative = false): ErrorResultInterface {
    const context: StackContextInterface = {
        code: '',
        error,
        formatCode: '',
        activeNative,
        includeFramework
    };

    const stackArray = parseErrorStack(error).stack;
    const stacks: Array<string> = stackArray
        .map(frame => stackEntry(context, frame, { linesAfter: 2, linesBefore: 3 }))
        .filter(Boolean);

    return {
        code: context.code,
        line: stackArray[0]?.line ?? 0,
        column: stackArray[0]?.column ?? 0,
        stacks: stacks.join('\n'),
        formatCode: context.formatCode
    };
}
