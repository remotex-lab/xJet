import type { StatusType } from '@global/components/constants/dispatcher-component.constants';

export interface DispatcherInterface {
    error?: unknown,
    status: StatusType
    parents: string[];
    duration?: number;
    description: string;
}
