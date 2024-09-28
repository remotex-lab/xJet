/**
 * Checks if a given value is a Promise-like object.
 *
 * A Promise-like object is an object that has a `then` method. This definition
 * includes native Promises, as well as other Promise implementations.
 *
 * @param candidate The value to check.
 * @returns `true` if the value is Promise-like, `false` otherwise.
 */

export function isPromise<T = unknown>(candidate: unknown): candidate is PromiseLike<T> {
    return (
        candidate != null &&
        (typeof candidate === 'object' || typeof candidate === 'function') &&
        typeof (candidate as any).then === 'function'
    );
}
