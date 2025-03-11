/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { TestFlagsType } from '@global/models/interfaces/test-model.interface';
import type { TestCallbackType, TestDirectiveInterface } from '@global/directives/interfaces/test-directive.interface';

/**
 * Imports
 */

import { each } from './each.directive';
import { TestModel } from '@global/models/test.model';
import { suiteState } from '@global/states/suite.state';
import { getInvocationLocation } from '@global/components/location.component';

class TestDirective extends Function {
    private flags: TestFlagsType = {};

    constructor() {
        super();

        return <this> new Proxy(this, {
            apply(target, thisArg, args: [string, FunctionType, number]) {
                target.invoke(args[0], args[1], [], args[2]);
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

    get todo(): this {
        if (this.flags.skip) throw new Error('Cannot use "todo" flag on skipped test');
        this.flags.todo = true;

        return this;
    }

    get failing(): this {
        if (this.flags.skip) throw new Error('Cannot use "failing" flag on skipped test');
        this.flags.failing = true;

        return this;
    }

    each<T extends ReadonlyArray<unknown>>(string: TemplateStringsArray, ...placeholders: T): TestCallbackType<Record<string, T[number]>>;
    each<T extends Array<unknown> | [unknown]>(...cases: T[]): TestCallbackType<T>; // array
    each<T>(...args: readonly T[]): TestCallbackType<T>; // object, and primitives
    each<T extends Array<unknown>>(...args: T): TestCallbackType<T[number]>; // primitives
    each(...args: Array<unknown>): TestCallbackType<unknown> {
        return each(this.invoke.bind(this), ...args);
    }

    invoke(description: string, block: FunctionType, args: Array<unknown> = [], timeout: number = 5000): void {
        // todo fix
        /**
         * import { f } from './x';
         *
         * describe('test', () => {
         *     // beforeAll(() => {
         *     //     console.log('beforeAll');
         *     // });
         *
         *     test('test', () => {
         *         expect(f(1, 2)).toBe(3);
         *     });
         *
         *     test('zxc', () => {
         *         const mock = xJet.mock(f);
         *
         *     })
         * })
         */

        const runningTest = suiteState.test;
        // if (runningTest) {
        //     // todo message
        //     throw new Error(`Cannot nest a test inside a test '${ description }' in '${ runningTest.name }'`);
        // }

        if (!block) {
            this.flags.todo = true;
        }

        const test = new TestModel(description, block, timeout, args, this.flags);
        test.setLocation(getInvocationLocation());
        suiteState.addTest(test);
        this.flags = {};
    }
}

export const testDirective = <TestDirectiveInterface> <unknown> new TestDirective();
