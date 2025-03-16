/**
 * Import will remove at compile time
 */

import { formatErrorCode, highlightCode, type SourceService } from '@remotex-labs/xmap';
import type { MessageHandlerInterface, SuiteFinishCallbackType } from './interfaces/message-handler.interface';

/**
 * Imports
 */

import { Struct } from '@remotex-labs/xstruct';
import { parseErrorStack } from '@remotex-labs/xmap';
import { MessageType } from './constants/message-handler.constant';
import { Colors } from '@components/colors.component';
import { xJetError } from '@errors/xjet.error';
import { ErrorHandler } from '@core/handler/error.handler';

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

    private routeData(header: MessageHandlerInterface, data: unknown) {
        switch (header.type) {
            case MessageType.LOG:
                break;
            case MessageType.TEST:
                break;
            case MessageType.SUITE: {
                this.suiteFinishCallbackType(header.suiteId);
                console.log(ErrorHandler(<Error> data, this.suites.get(header.suiteId)!));
                break;
            }
            case MessageType.DESCRIBE:
                break;
        }
    }
}
