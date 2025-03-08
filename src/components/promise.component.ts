/**
 * Determines if a given value is a Promise-like object.
 * A value is considered Promise-like if it is an object or function that has a `then` method.
 *
 * @template T The type of the resolved value for the Promise-like object.
 *
 * @param candidate - The value being tested for Promise-like characteristics.
 *
 * @returns A boolean indicating whether the candidate is Promise-like.
 *
 * @remarks This utility can be useful for type-checking in dynamic scenarios where the presence
 * of a `then` method is used as an indicator of Promise-like behavior.
 *
 * @since 1.0.0
 */

export function isPromise<T = unknown>(candidate: unknown): candidate is PromiseLike<T> {
    return (
        candidate != null &&
        (typeof candidate === 'object' || typeof candidate === 'function') &&
        typeof (candidate as Promise<unknown>).then === 'function' ||
        (typeof candidate === 'function' && candidate.constructor.name === 'AsyncFunction')
    );
}
