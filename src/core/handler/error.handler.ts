import type { SourceService } from '@remotex-labs/xmap';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import type { SuiteMessageInterface } from '@core/handler/interfaces/message-handler.interface';

export function ErrorHandler(error: VMRuntimeError, sourceMap: SourceService): string {
    console.log(error.stack);

    console.log(new VMRuntimeError(error, sourceMap));

    return '';
}
