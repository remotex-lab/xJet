import { Struct } from '@remotex-labs/xstruct';
import type {
    ActionMessageInterface,
    MessageHandlerInterface
} from '@core/handler/interfaces/message-handler.interface';
import { MessageType } from '@core/handler/constants/message-handler.constant';

export class EmitService {
    readonly messageHeader: Struct<MessageHandlerInterface>;

    constructor() {
        this.messageHeader = new Struct({
            type: 'UInt8',
            suiteId: { type: 'string', size: 14 },
            runnerId: { type: 'string', size: 14 }
        });
    }

    logDispatcher() {

    }

    testDispatcher(action: ActionMessageInterface) {
        this.dispatcher(MessageType.TEST, JSON.stringify(action));
    }

    suiteDispatcher(action: ActionMessageInterface) {
        this.dispatcher(MessageType.SUITE, JSON.stringify(action));
    }

    describeDispatcher(action: ActionMessageInterface) {
        this.dispatcher(MessageType.DESCRIBE, JSON.stringify(action));
    }

    private headerCreate(type: MessageType): Buffer {
        return this.messageHeader.toBuffer({
            type: type,
            suiteId: __XJET__.suiteId,
            runnerId: __XJET__.runnerId
        });
    }

    private dispatcher(type: MessageType, data: string): void {
        const header = this.headerCreate(type);
        const message = Buffer.from(data);

        dispatch(Buffer.concat([ header, message ]));
    }
}

export const emitService = new EmitService();
