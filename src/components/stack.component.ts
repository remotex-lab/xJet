/**
 * Import will remove at compile time
 */

import type { StackFrame,  PositionWithCodeInterface } from '@remotex-labs/xmap';
import type { ErrorType, StackContextInterface } from '@components/interfaces/stack-component.interface';

/**
 * Imports
 */

import { dirname, join, relative } from 'path';
import { Colors, setColor } from '@components/colors.component';
import { frameworkProvider } from '@providers/framework.provider';
import { parseStackLine, formatErrorCode, highlightCode, parseErrorStack } from '@remotex-labs/xmap';

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
    EVAL_MACHINE = 'evalmachine.<anonymous>'
}

export function extractEnhancedFrameDetails(callSite: NodeJS.CallSite): StackFrame {
    const frame: StackFrame = {
        isEval: callSite.isEval(),
        source: callSite.toString(),
        fileName: callSite.getFileName() || callSite.getScriptNameOrSourceURL() || null,
        lineNumber: callSite.getLineNumber() !== undefined ? callSite.getLineNumber() : null,
        columnNumber: callSite.getColumnNumber() !== undefined ? callSite.getColumnNumber() : null,
        functionName: callSite.getFunctionName() || callSite.getMethodName() || null
    };

    if(callSite.isEval() && callSite.getEvalOrigin() && callSite.getEvalOrigin()!.includes('at')) {
        const evalPosition = parseStackLine(callSite.getEvalOrigin()!, 0);
        frame.evalOrigin = {
            fileName: evalPosition.fileName,
            lineNumber: evalPosition.lineNumber,
            columnNumber: evalPosition.columnNumber,
            functionName: evalPosition.functionName
        };
    }

    return frame;
}

export function highlightPositionCode(position: PositionWithCodeInterface): string {
    const highlightedCode = highlightCode(position.code);

    return formatErrorCode({ ...position, code: highlightedCode }, {
        color: Colors.BrightPink,
        reset: Colors.Reset
    });
}

export function formatErrorLine(frame: StackFrame): string {
    const position = (frame.lineNumber && frame.columnNumber) ? setColor(Colors.Gray, `[${ frame.lineNumber }:${ frame.columnNumber }]`) : '';

    return `at ${ frame.functionName } ${ setColor(Colors.DarkGray, frame.fileName ?? '') } ${ position }`
        .replace(/\s{2,}/g, ' ')
        .trim();
}

export function buildSourceMapPath(this: StackContextInterface, frame: StackFrame, position: Required<PositionWithCodeInterface>): string {
    const filename = (frame.fileName ?? this.framework.paths.root).replace(/^file:\/\/\//, '');
    const distDirectory = dirname(filename);
    const rootPath = this.framework.getRootDirectory(frame.fileName ?? '');
    const filepath = relative(rootPath, join(distDirectory, position.source));

    if (position.sourceRoot)
        return `${ (position.sourceRoot + filepath).replace(/\\/g, '/') }#L${ position.line }`;

    return join(rootPath, filepath);
}

export function formatPositionErrorLine(this: StackContextInterface, frame: StackFrame, position: Required<PositionWithCodeInterface>): string {
    if (position.name && this.error.name == STACK_CONSTANTS.TYPE_ERROR) {
        this.error.message = this.error.message.replace(/^\S+/, position.name);
    }

    if (!this.code)
        this.code = highlightPositionCode(position);

    return formatErrorLine({
        ...frame,
        lineNumber: position.line,
        columnNumber: position.column,
        functionName: position.name ?? frame.functionName,
        source: buildSourceMapPath.call(this, frame, position)
    });
}

export function stackEntry(this: StackContextInterface, frame: StackFrame): string {
    const isNodeNative = (frame.fileName ?? '').startsWith('node') ?? false;
    const isxJetServiceFile = this.framework.isFrameworkSourceFile(frame.fileName ?? undefined);

    if (
        (!this.activeNative && isNodeNative) ||
        (isxJetServiceFile && !this.includeFramework)
    ) return '';

    let position: PositionWithCodeInterface | null = null;
    if (isxJetServiceFile)
        position = this.framework.getFrameworkSourceMap(frame.fileName ?? undefined).getPositionWithCode(frame.lineNumber ?? 0, frame.columnNumber ?? 0);
    else if (this.error.sourceMap)
        position = this.error.sourceMap.getPositionWithCode(frame.lineNumber ?? 0, frame.columnNumber ?? 0);

    if (position)
        return formatPositionErrorLine.call(this, frame, position);

    if (frame.fileName === STACK_CONSTANTS.EVAL_MACHINE && !frame.functionName)
        return '';

    return formatErrorLine(frame);
}

export function formatStringStacks(error: ErrorType, includeFramework = false, activeNative = false): string {
    const context: StackContextInterface = {
        code: '',
        error,
        framework: frameworkProvider,
        activeNative,
        includeFramework
    };

    const stacks: Array<string> = parseErrorStack(error).stack
        .map(frame => stackEntry.call(context, frame))
        .filter(Boolean);

    let formattedError = `\n${ error.name }: \n${ setColor(Colors.LightCoral, error.message) }\n\n`;
    if (context.code)
        formattedError += `${ context.code }\n\n`;

    if (stacks.length > 0)
        formattedError += `Enhanced Stack Trace:\n${ stacks.join('\n') }\n`;

    return formattedError;
}

export function formatStacks(error: ErrorType, frames: Array<NodeJS.CallSite>, includeFramework = false, activeNative = false): string {
    const context: StackContextInterface = {
        code: '',
        error,
        framework: frameworkProvider,
        activeNative,
        includeFramework
    };

    console.log(parseErrorStack(error).stack);

    // const stacks: Array<string> = frames
    //     .map(frame => stackEntry.call(context, extractEnhancedFrameDetails(frame)))
    //     .filter(Boolean);

    const stacks: Array<string> = parseErrorStack(error).stack
        .map(frame => stackEntry.call(context, frame))
        .filter(Boolean);

    let formattedError = `\n${ error.name }: \n${ setColor(Colors.LightCoral, error.message) }\n\n`;
    if (context.code)
        formattedError += `${ context.code }\n\n`;

    if (stacks.length > 0)
        formattedError += `Enhanced Stack Trace:\n${ stacks.join('\n') }\n`;

    return formattedError;
}
