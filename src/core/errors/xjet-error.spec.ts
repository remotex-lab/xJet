/**
 * Imports
 */

import { xJetError } from '@errors/xjet.error';

/**
 * Mock dependencies
 */

jest.mock('@errors/base.error', () => {
    return {
        BaseError: jest.fn().mockImplementation((name, message) => {
            return {
                name,
                message,
                reformatStack: jest.fn()
            };
        })
    };
});


/**
 * Tests
 */

describe('xJetError', () => {
    let error: xJetError;
    const errorMessage = 'Test error message';

    beforeEach(() => {
        error = new xJetError(errorMessage);

    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should be an instance of BaseError', () => {
        expect(error).toBeDefined();
    });

    test('should set the correct error name', () => {
        expect(error.name).toBe('xJetError');
    });

    test('should set the correct error message', () => {
        expect(error.message).toBe(errorMessage);
    });

    test('should call reformatStack with correct parameters', () => {
        expect((<any> error).reformatStack).toHaveBeenCalledWith(error, true);
    });

    test('should be throwable and catchable', () => {
        const throwError = () => {
            throw new xJetError(errorMessage);
        };

        expect(throwError).toThrow();
    });
});
