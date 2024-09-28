import type { TestEventType } from '@const/test.const';
import type { TestModel } from '@models/test.model';

export interface EventInterface {
    type: TestEventType;
    test: TestModel,
    error?:any; // todo
}

export function dispatch(x: EventInterface): void {
    sendResponse(JSON.stringify(x));
}
