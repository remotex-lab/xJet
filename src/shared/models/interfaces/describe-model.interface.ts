/**
 * Import will remove at compile time
 */

import type { HookModel } from '@shared/models/hook.model';

/**
 * Interface representing options that dictate behavioral conditions.
 *
 * @remarks
 * The `DescribeOptionsType` interface is used to configure specific conditions,
 * such as whether to skip or exclusively include certain functionalities or operations.
 * Each flag is optional, providing flexibility in configuring behavior.
 *
 * @since 1.0.0
 */

export interface DescribeOptionsType {
    skip?: boolean;
    only?: boolean;
}

/**
 * Interface describing a set of hooks commonly used for managing lifecycle events in testing or execution frameworks.
 *
 * @remarks
 * Each hook is represented by an array of `HookModel` objects,
 * which define the specific behavior or logic of the hooks.
 * This interface provides structure for grouping lifecycle hooks,
 * such as those executed before and after tests or operations.
 * It facilitates consistent management of these hooks in various implementations.
 *
 * @since 1.0.0
 */

export interface DescribeHooksInterface {
    afterAll: Array<HookModel>
    beforeAll: Array<HookModel>
    afterEach: Array<HookModel>
    beforeEach: Array<HookModel>
}

/**
 * Represents an interface for managing and maintaining context-related errors in a system.
 *
 * @remarks
 * This interface is intended to provide a structured way to handle
 * error lists in a context system, specifically errors that occur before and after all operations,
 * ensuring both pre-operation and post-operation errors are managed cohesively.
 *
 * @since 1.0.0
 */

export interface ContextInterface {
    afterAllErrors: Array<unknown>
    beforeAllErrors: Array<unknown>
}

/**
 * Represents an interface for managing and maintaining context-related errors in a system.
 *
 * @remarks
 * This interface is intended to provide a structured way to handle
 * error lists in a context system, specifically errors that occur before and after all operations,
 * ensuring both pre-operation and post-operation errors are managed cohesively.
 *
 * @since 1.0.0
 */

export interface ContextInterface {
    afterAllErrors: Array<unknown>
    beforeAllErrors: Array<unknown>
}
