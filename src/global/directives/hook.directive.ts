/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';

/**
 * Imports
 */

import { HookModel } from '@global/models/hook.model';
import { suiteState } from '@global/states/suite.state';
import { HookType } from '@global/models/constants/describe-model.constants';
import { getInvocationLocation } from '@global/components/location.component';

export function afterAllDirective(callback: FunctionType, timeout: number = 5000) {
    const hook = new HookModel(callback, timeout);
    hook.setLocation(getInvocationLocation());
    suiteState.describe.addHook(HookType.AFTER_ALL, hook);
}

export function beforeAllDirective(callback: FunctionType, timeout: number = 5000) {
    const hook = new HookModel(callback, timeout);
    hook.setLocation(getInvocationLocation());
    suiteState.describe.addHook(HookType.BEFORE_ALL, hook);
}

export function afterEachDirective(callback: FunctionType, timeout: number = 5000) {
    const hook = new HookModel(callback, timeout);
    hook.setLocation(getInvocationLocation());
    suiteState.describe.addHook(HookType.AFTER_EACH, hook);
}

export function beforeEachDirective(callback: FunctionType, timeout: number = 5000) {
    const hook = new HookModel(callback, timeout);
    hook.setLocation(getInvocationLocation());
    suiteState.describe.addHook(HookType.AFTER_ALL, hook);
}
