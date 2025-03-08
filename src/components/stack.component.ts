/**
 * Import will remove at compile time
 */

import type {
    ErrorType,
    StackContextInterface,
    EnhancedFrameInterface
} from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { dirname, join, relative } from 'path';
import { Colors, setColor } from '@components/colors.component';
import { frameworkProvider } from '@providers/framework.provider';
import { formatErrorCode, highlightCode, type PositionWithCodeInterface } from '@remotex-labs/xmap';

/**
 * Enum representing constant values used within the STACK module.
 *
 * These constants are commonly used for identifying error types,
 * labels, and machine-evaluated script identifiers. They facilitate
 * standardized communication and prevent hard-coding of literal strings.
 *
 * @since 1.0.0
 */

const enum STACK_CONSTANTS {
    TYPE_ERROR = 'TypeError',
    NATIVE_LABEL = '<native>',
    EVAL_MACHINE = 'evalmachine.<anonymous>',
    ANONYMOUS_LABEL = '<anonymous>'
}

/**
 * Constructs a path to the original source file from stack trace information using source maps
 *
 * @param frameObject - Node.js CallSite object providing the current file location
 * @param position - Position information containing source path and mapping details
 * @returns Path to the original source file, with line number reference when sourceRoot is provided
 *
 * @throws Error - When the framework context is not properly initialized
 *
 * @remarks
 * The function handles translation from compiled paths to original source paths
 * using the project's directory structure and source map data. It normalizes file paths,
 * removes 'file:///' prefixes, and handles both relative and absolute paths.
 *
 * @example
 * ```ts
 * const context = { framework: { paths: { root: '/project' }, getRootDirectory: () => '/project' } };
 * const frame = { getFileName: () => '/project/dist/file.js' };
 * const position = { source: '../src/file.ts', sourceRoot: '/project/', line: 42, column: 10, code: '' };
 *
 * const path = buildSourceMapPath.call(context, frame, position);
 * // Returns: '/project/src/file.ts#L42'
 * ```
 *
 * @see StackContextInterface
 * @see NodeJS.CallSite
 * @see PositionWithCodeInterface
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
 * Extracts detailed frame information from a NodeJS CallSite object into a standardized interface
 *
 * @param frame - NodeJS CallSite object from an error stack trace
 * @returns Standardized frame details including line, column, source path and function name
 *
 * @remarks
 * This function normalizes stack frame information, handling edge cases like native functions,
 * missing file names, and type information. It formats function names to include type names
 * when available and provides fallback values when information is missing.
 *
 * @example
 * ```ts
* const callSite = errorStack[0]; // First frame from Error.stack
* const frameDetails = extractEnhancedFrameDetails(callSite);
* // Returns: { line: 42, column: 10, source: '/path/to/file.js', name: 'MyClass.myMethod' }
* ```
 *
 * @see NodeJS.CallSite
 * @see EnhancedFrameInterface
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
 * Formats a stack frame into a human-readable error line with colorized output
 *
 * @param frameObject - NodeJS CallSite object containing detailed frame information
 * @param frame - Enhanced frame interface with normalized frame details
 * @returns Formatted error line string with color highlighting
 *
 * @remarks
 * This function creates a standardized representation of an error stack frame,
 * handling special cases like Promise.all rejections and async functions. It applies
 * color formatting to improve readability in terminal output and ensures consistent
 * spacing in the output string.
 *
 * @example
 * ```ts
 * const callSite = errorStack[0];
 * const enhancedFrame = extractEnhancedFrameDetails(callSite);
 * const formattedLine = formatErrorLine(callSite, enhancedFrame);
 * // Returns: "at async myFunction /path/to/file.js [42:10]"
 * ```
 *
 * @see EnhancedFrameInterface
 * @see NodeJS.CallSite
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
 * Highlights and formats a code snippet based on position information
 *
 * @param position - Position data containing code snippet and location details
 * @returns Formatted string with syntax highlighting for the error code snippet
 *
 * @remarks
 * This function applies syntax highlighting to the code snippet and then formats it
 * with error position indicators. It uses color formatting to make the error location
 * visually distinct in terminal output.
 *
 * @example
 * ```ts
 * const position = {
 *   code: 'const x = y.undefined();',
 *   line: 1,
 *   column: 10
 * };
 *
 * const highlighted = highlightPositionCode(position);
 * // Returns a colorized string with the error position emphasized
 * ```
 *
 * @see PositionWithCodeInterface
 * @see formatErrorCode
 * @see highlightCode
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
 * Formats an error line with source map position data and optionally updates error information
 *
 * @param frameObject - NodeJS CallSite object from the error stack
 * @param position - Position information with code context from source maps
 * @returns Formatted error line string with original source location
 *
 * @remarks
 * This function enhances error reporting by incorporating source map information into stack traces.
 * It updates the error type name for TypeError instances when position data includes a name.
 * If no highlighted code exists in the context, it will generate it from the position information.
 *
 * @example
 * ```ts
 * const context = {
 *   error: { name: 'TypeError', message: 'undefined is not a function' },
 *   framework: { paths: { root: '/project' }, getRootDirectory: () => '/project' },
 *   code: null
 * };
 * const position = {
 *   source: 'src/file.ts',
 *   line: 42,
 *   column: 10,
 *   name: 'myFunction',
 *   code: 'const result = myFunction();'
 * };
 *
 * const formattedLine = formatPositionErrorLine.call(context, callSite, position);
 * // Updates context.error.message and context.code, returns formatted line
 * ```
 *
 * @see StackContextInterface
 * @see PositionWithCodeInterface
 * @see formatErrorLine
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
 * Processes a single stack frame and returns its formatted representation
 *
 * @param frameObject - NodeJS CallSite object representing a stack frame
 * @returns Formatted error line for the stack frame or empty string if filtered out
 *
 * @remarks
 * This function determines how to display each stack trace entry based on configuration
 * and frame characteristics. It filters out certain frames based on settings (native code,
 * framework files) and enhances others with source map information when available.
 *
 * The function uses source maps to provide original source locations instead of compiled
 * locations when possible. It also applies special handling for eval contexts.
 *
 * @example
 * ```ts
 * const context = {
 *   error: { name: 'Error', message: 'Something went wrong', sourceMap: sourceMapInstance },
 *   framework: {
 *     isFrameworkSourceFile: (file) => file.includes('@xjet'),
 *     sourceMap: frameworkSourceMapInstance,
 *     paths: { root: '/project' }
 *   },
 *   activeNative: false,
 *   activexJetService: true,
 *   code: null
 * };
 *
 * const entry = stackEntry.call(context, callSiteObject);
 * // Returns formatted stack entry or empty string if filtered
 * ```
 *
 * @see StackContextInterface
 * @see formatPositionErrorLine
 * @see formatErrorLine
 * @since 1.0.0
 */

export function stackEntry(this: StackContextInterface, frameObject: NodeJS.CallSite): string {
    const isNodeNative = frameObject.getFileName()?.startsWith('node') ?? false;
    const isxJetServiceFile = this.framework.isFrameworkSourceFile(frameObject.getFileName());

    if (
        (!this.activeNative && isNodeNative) ||
        (isxJetServiceFile && !this.includeFramework)
    ) return '';

    let position: PositionWithCodeInterface | null = null;
    const frame = extractEnhancedFrameDetails(frameObject);
    if (isxJetServiceFile)
        position = this.framework.getFrameworkSourceMap(frameObject.getFileName()).getPositionWithCode(frame.line, frame.column);
    else if (this.error.sourceMap)
        position = this.error.sourceMap.getPositionWithCode(frame.line, frame.column);

    if (position)
        return formatPositionErrorLine.call(this, frameObject, position);

    if (frameObject.getFileName() === STACK_CONSTANTS.EVAL_MACHINE && !frameObject.getFunctionName())
        return '';

    return formatErrorLine(frameObject, frame);
}

/**
 * Creates a comprehensive formatted error output with enhanced stack trace
 *
 * @param error - The error object to format
 * @param frames - Array of CallSite objects representing the stack frames
 * @param includeFramework - Flag to include framework-related files in the output (default: false)
 * @param activeNative - Flag to include Node.js native code in the output (default: false)
 * @returns A formatted string with error details, code snippet, and stack trace
 *
 * @remarks
 * This function orchestrates the entire error formatting process, creating a complete
 * error report with the error name, message, relevant code snippet (if available),
 * and enhanced stack trace. The stack trace is filtered and formatted according to
 * the provided configuration flags.
 *
 * The resulting output uses color formatting for improved readability in terminal
 * environments and includes source map information when available.
 *
 * @example
 * ```ts
 * const error = new Error('Something went wrong');
 * const callSites = getCallSites(error);
 *
 * const formattedOutput = formatStacks(error, callSites, true, false);
 * console.log(formattedOutput);
 * // Outputs colorized error with enhanced stack trace
 * ```
 *
 * @see ErrorType
 * @see StackContextInterface
 * @see stackEntry
 * @since 1.0.0
 */

export function formatStacks(error: ErrorType, frames: Array<NodeJS.CallSite>, includeFramework = false, activeNative = false): string {
    const context: StackContextInterface = {
        code: '',
        error,
        framework: frameworkProvider,
        activeNative,
        includeFramework
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
