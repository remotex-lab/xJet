import type { SourceService } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap';
import { formatErrorLine } from '@components/stack.component';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import type { SuiteMessageInterface } from '@core/handler/interfaces/message-handler.interface';

export function ErrorHandler(error: VMRuntimeError, sourceMap: SourceService): string {
    console.log(new VMRuntimeError(error, sourceMap));
    // const x = parseErrorStack(error);
    // console.log('xxx');
    // console.log(error.callStacks[0].getFileName());

    // for (const item of x.stack) {
    //     const pos = sourceMap.getPositionWithCode(item.lineNumber!, item.columnNumber!);
    //     console.log(pos, item);
    // }

    return '';
}
