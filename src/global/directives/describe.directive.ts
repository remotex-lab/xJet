/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { DescribeFlagsType } from '@global/models/interfaces/describe-model.interface';

/**
 * Imports
 */

import { suiteState } from '@global/states/suite.state';
import type {
    DescribeCallbackType,
    DescribeDirectiveInterface
} from '@global/directives/interfaces/describe-directive.interface';
import { each } from '@global/directives/each.directive';

class DescribeDirective extends Function {
    private flags: DescribeFlagsType = {};

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
    each(...args: Array<unknown>): DescribeCallbackType<unknown> {
        return each(this.invoke.bind(this), ...args);
    }

    invoke(description: string, block: FunctionType, args: Array<unknown> = []): void {
        const runningTest = suiteState.test;
        if (runningTest) {
            // todo message
            throw new Error(`Cannot nest a describe inside a test '${ description }' in '${ runningTest.name }'`);
        }

        suiteState.addDescribe(description, block, this.flags, args);
        this.flags = {};
    }
}

export const describeDirective = <DescribeDirectiveInterface> <unknown> new DescribeDirective();
