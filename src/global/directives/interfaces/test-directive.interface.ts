import type { FunctionType } from '@interfaces/function.interface';
import type { CallbackHandlerType, DoneCallbackType } from '@global/models/interfaces/hook-model.interface';

export type TestCallbackType<T> = (
    name: string, fn: (args: T, done: DoneCallbackType) => void | ((args: T) => Promise<void>)
) => void;

export interface TestDirectiveInterface {
    (name: string, fn?: CallbackHandlerType, timeout?: number): void;
    get skip(): TestDirectiveInterface;
    get only(): TestDirectiveInterface;
    get todo(): TestDirectiveInterface;
    get failing(): TestDirectiveInterface;
    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): TestCallbackType<Record<string, T[number]>>;
    each<T extends Array<unknown> | [unknown]>(...cases: T[]): TestCallbackType<T>;
    each<T>(...args: readonly T[]): TestCallbackType<T>;
    each<T extends Array<unknown>>(...args: T): TestCallbackType<T[number]>;
    invoke(description: string, block: FunctionType, args?: Array<unknown>, timeout?: number): void;
}

