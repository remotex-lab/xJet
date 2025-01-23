import type { FunctionType } from '@interfaces/function.interface';

export type InvokeType = (description: string, block: FunctionType, args: Array<unknown>, timeout?: number) => void;
