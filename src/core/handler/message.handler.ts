/**
 * Import will remove at compile time
 */

import { type SourceService } from '@remotex-labs/xmap';
import type {
    MessageHandlerInterface,
    SuiteFinishCallbackType,
    SuiteMessageInterface
} from './interfaces/message-handler.interface';

/**
 * Imports
 */
import { Struct } from '@remotex-labs/xstruct';
import { MessageType } from './constants/message-handler.constant';
import { xJetError } from '@errors/xjet.error';
import { ErrorHandler } from '@core/handler/error.handler';
import type { VMRuntimeError } from '@errors/vm-runtime.error';

export class MessageHandler {
    readonly suites: Map<string, SourceService> = new Map();
    readonly runners: Map<string, string> = new Map();
    readonly messageHeader: Struct<MessageHandlerInterface>;

    constructor(private suiteFinishCallbackType: SuiteFinishCallbackType) {
        this.messageHeader = new Struct({
            type: 'UInt8',
            suiteId: { type: 'string', size: 14 },
            runnerId: { type: 'string', size: 14 }
        });
    }

    setRunner(id: string, name: string) {
        this.runners.set(id, name);
    }

    setSuiteSource(id: string, service: SourceService) {
        this.suites.set(id, service);
    }

    processData(data: Buffer): void {
        const header = this.messageHeader.toObject(data);
        const stringObject = data.subarray(this.messageHeader.size).toString();

        try {
            const object = JSON.parse(stringObject);
            this.routeData(header, object);
        } catch (error) {
            throw new xJetError((<Error> error).message);
        }
    }

    handleSuiteError(suiteId: string, data: SuiteMessageInterface, sourceMap: SourceService | undefined): void {
        this.suiteFinishCallbackType(suiteId);
        console.log(ErrorHandler(<VMRuntimeError> data.error, sourceMap!));
    }

    private routeData(header: MessageHandlerInterface, data: unknown) {
        switch (header.type) {
            case MessageType.LOG:
                break;
            case MessageType.TEST:
                break;
            case MessageType.SUITE:
                this.handleSuiteError(
                    header.suiteId, <SuiteMessageInterface> data, this.suites.get(header.suiteId)
                );
                break;
            case MessageType.DESCRIBE:
                break;
        }
    }
}
