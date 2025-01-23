/**
 * Import will remove at compile time
 */

import type { EmptyFunctionType, FunctionType } from '@interfaces/function.interface';
import type { DescribeCallbackType, FlagsInterface } from '@global/directives/interfaces/describe-directive.interface';


class DescribeDirective extends Function {
    private flags: FlagsInterface = {};

    constructor() {
        super();

        return <this> new Proxy(this, {
            apply(target, thisArg, args: [string, FunctionType]) {
                target.invoke(args[0], args[1]);
            }
        });
    }

    get skip(): this {
        if (this.flags.only) throw new Error('Cannot use "skip" flag on only test');
        this.flags.skip = true;

        return this;
    }

    get only(): this {
        if (this.flags.skip) throw new Error('Cannot use "only" flag on skipped test');
        this.flags.only = true;

        return this;
    }

    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): DescribeCallbackType<Record<string, T[number]>>;
    each<T extends Array<unknown> | [unknown]>(...cases: T[]): DescribeCallbackType<T>; // array
    each<T>(...args: readonly T[]): DescribeCallbackType<T>; // object, and primitives
    each<T extends Array<unknown>>(...args: T): DescribeCallbackType<T[number]>; // primitives
    each(a: any, ...args: any[]): any {
        // will be set in the future

        console.log(a, args);

        return (name: string, fn: FunctionType, timeout?: number) => {
            console.log(name, fn, timeout);
        };
    }

    invoke(name: string, fn: EmptyFunctionType): void {
        console.log('xxx');
        console.log(this.flags);

        console.log(name, fn);

        this.flags = {};
    }
}

export const describeDirective = new DescribeDirective();
