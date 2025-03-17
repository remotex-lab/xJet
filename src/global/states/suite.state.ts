/**
 * Import will remove at compile time
 */

import type { TestModel } from '@global/models/test.model';
import type { FunctionType } from '@interfaces/function.interface';
import type { DescribeFlagsType } from '@global/models/interfaces/describe-model.interface';

/**
 * Imports
 */

import { DescribeModel } from '@global/models/describe.model';
import { emitService } from '@global/services/emit.service';
import { ActionType } from '@core/handler/constants/message-handler.constant';
import { ExecutionError } from '@global/errors/execution.error';

export class SuiteState {
    private onlyMode: boolean = false;
    private currentDescribe: DescribeModel;
    private currentTest: TestModel | null = null;
    private readonly rootDescribe: DescribeModel;

    constructor() {
        this.rootDescribe = new DescribeModel();
        this.currentDescribe = this.rootDescribe;
    }

    // todo
    get isOnlyMode(): boolean {
        return this.onlyMode;
    }

    get root(): DescribeModel {
        return this.rootDescribe;
    }

    get describe(): DescribeModel {
        return this.currentDescribe;
    }

    get test(): TestModel | null {
        return this.currentTest;
    }

    set test(test: TestModel) {
        this.currentTest = test;
    }

    addDescribe(description: string, describe: FunctionType, flags: DescribeFlagsType = {}, describeArgs: Array<unknown> = []): void {
        this.onlyMode ||= flags.only ?? false;
        const newDescribe = new DescribeModel(description, flags);
        this.currentDescribe.addDescribe(newDescribe);
        const previousDescribe = this.currentDescribe;
        this.currentDescribe = newDescribe;

        try {
            describe.apply({}, describeArgs);
        } finally {
            this.currentDescribe = previousDescribe;
        }
    }

    addTest(test: TestModel): void {
        this.onlyMode ||= test.flags.only ?? false;
        this.currentDescribe.addTest(test);
    }
}

export const suiteState = new SuiteState();
