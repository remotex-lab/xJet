/**
 * Imports
 */

import { isPromise } from '@components/promise.component';

/**
 * Tests
 */

describe('isPromise', () => {
    test('should return true for native Promise', () => {
        const promise = new Promise(() => {});
        expect(isPromise(promise)).toBe(true);
    });

    test('should return true for Promise-like objects', () => {
        const promiseLike = {
            then: () => {}
        };
        expect(isPromise(promiseLike)).toBe(true);
    });

    test('should return true for async functions', async () => {
        const asyncFn = async () => {};
        expect(isPromise(asyncFn)).toBe(true);
    });

    test('should return false for null', () => {
        expect(isPromise(null)).toBe(false);
    });

    test('should return false for undefined', () => {
        expect(isPromise(undefined)).toBe(false);
    });

    test('should return false for objects without then method', () => {
        expect(isPromise({})).toBe(false);
    });

    test('should return false for non-function then property', () => {
        const nonPromise = {
            then: 'not a function'
        };
        expect(isPromise(nonPromise)).toBe(false);
    });

    test('should return false for primitive values', () => {
        expect(isPromise(42)).toBe(false);
        expect(isPromise('string')).toBe(false);
        expect(isPromise(true)).toBe(false);
        expect(isPromise(Symbol())).toBe(false);
    });
});
