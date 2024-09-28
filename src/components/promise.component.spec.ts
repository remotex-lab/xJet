import { isPromise } from './promise.component';

describe('isPromise', () => {
    test('should return true for a native Promise', () => {
        expect(isPromise(Promise.resolve())).toBe(true);
    });

    test('should return true for a Promise-like object with a then method', () => {
        const promiseLike = {
            then: () => {
            }
        };
        expect(isPromise(promiseLike)).toBe(true);
    });

    test('should return false for a value that is not an object or a function', () => {
        expect(isPromise(null)).toBe(false);
        expect(isPromise(undefined)).toBe(false);
        expect(isPromise('string')).toBe(false);
        expect(isPromise(123)).toBe(false);
        expect(isPromise(true)).toBe(false);
    });

    test('should return false for an object without a then method', () => {
        const obj = {};
        expect(isPromise(obj)).toBe(false);
    });

    test('should return false for a function that is not a Promise', () => {
        const func = () => {
        };
        expect(isPromise(func)).toBe(false);
    });
});
