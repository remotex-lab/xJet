import type { SourceService } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap';
import { formatErrorLine } from '@components/stack.component';

export function ErrorHandler(error: Error, source: SourceService): string {
    console.log(error);
    const x = parseErrorStack(error);

    for (const item of x.stack) {
        const pos = source.getPositionWithCode(item.lineNumber!, item.columnNumber!);
        console.log(pos, item);
    }


    return '';
}
