import type { FunctionType } from '@interfaces/function.interface';
export type DescribeCallbackType<T> = (name: string, fn: (args: T) => void) => void;

export interface DescribeDirectiveInterface {
    (name: string, fn: () => void): void;
    get skip(): this;
    get only(): this;
    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): DescribeCallbackType<Record<string, T[number]>>;
    each<T extends Array<unknown> | [unknown]>(...cases: T[]): DescribeCallbackType<T>;
    each<T>(...args: readonly T[]): DescribeCallbackType<T>;
    each<T extends Array<unknown>>(...args: T): DescribeCallbackType<T[number]>;
    invoke(description: string, block: FunctionType, args?: Array<unknown>): void;
}
