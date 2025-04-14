/**
 * Imports
 */

import { errorReplacer, errorToSerializable, formatValue } from '@components/json.component';

/**
 * Tests
 */

describe('Json Utilities', () => {
    describe('errorToSerializable', () => {
        test('should convert an Error to a serializable object', () => {
            // Arrange
            const error = new Error('Test error');
            error.stack = 'test-stack';
            (error as any).code = 500;

            // Act
            const result = errorToSerializable(error);

            // Assert
            expect(result).toEqual({
                name: 'Error',
                message: 'Test error',
                stack: 'test-stack',
                code: 500
            });
        });

        test('should preserve custom properties on Error objects', () => {
            // Arrange
            class CustomError extends Error {
                constructor(message: string, public statusCode: number) {
                    super(message);
                    this.name = 'CustomError';
                }
            }

            const error = new CustomError('Custom error', 404);

            // Act
            const result = errorToSerializable(error);

            // Assert
            expect(result).toHaveProperty('statusCode', 404);
            expect(result).toHaveProperty('name', 'CustomError');
            expect(result).toHaveProperty('message', 'Custom error');
            expect(result).toHaveProperty('stack');
        });
    });

    describe('errorReplacer', () => {
        test('should convert Error objects to serializable objects', () => {
            // Arrange
            const error = new Error('Test error');

            // Act
            const result = errorReplacer('error', error);

            // Assert
            expect(result).toEqual({
                name: 'Error',
                message: 'Test error',
                stack: error.stack
            });
        });

        test('should return non-Error values unchanged', () => {
            // Arrange
            const testCases = [
                { key: 'string', value: 'test' },
                { key: 'number', value: 42 },
                { key: 'boolean', value: true },
                { key: 'object', value: { a: 1 } },
                { key: 'array', value: [ 1, 2, 3 ] },
                { key: 'null', value: null },
                { key: 'undefined', value: undefined }
            ];

            // Act & Assert
            testCases.forEach(({ key, value }) => {
                expect(errorReplacer(key, value)).toBe(value);
            });
        });
    });

    describe('formatValue', () => {
        test('should handle primitive values correctly', () => {
            // Act & Assert
            expect(formatValue(null)).toBe('null');
            expect(formatValue(undefined)).toBe('undefined');
            expect(formatValue(42)).toBe('42');
            expect(formatValue('string')).toBe('string');
            expect(formatValue(true)).toBe('true');
        });

        test('should handle Error objects correctly', () => {
            // Arrange
            const error = new Error('Test error');
            const expectedJson = JSON.stringify(errorToSerializable(error), null, 2);

            // Act
            const result = formatValue(error);

            // Assert
            expect(result).toBe(expectedJson);
        });

        test('should handle objects with custom toJSON methods', () => {
            // Arrange
            const obj = {
                toJSON: () => ({ customized: true })
            };

            // Act
            const result = formatValue(obj);

            // Assert
            expect(result).toBe(JSON.stringify({ customized: true }, errorReplacer, 2));
        });

        test('should handle regular objects correctly', () => {
            // Arrange
            const obj = { a: 1, b: 'test' };

            // Act
            const result = formatValue(obj);

            // Assert
            expect(result).toBe(JSON.stringify(obj, errorReplacer, 2));
        });

        test('should return empty object when circular references are found', () => {
            // Arrange
            const circularObj: any = { a: 1 };
            circularObj.self = circularObj;

            // Act
            const result = formatValue(circularObj);

            // Assert
            expect(result).toBe('{}');
        });

        test('should support util.inspect.custom symbol for custom representation', () => {
            // Arrange
            const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
            const obj = {
                data: 'test data',
                [customInspectSymbol]: function() {
                    return `<CustomFormat: ${this.data}>`;
                }
            };

            // Act
            const result = formatValue(obj);

            // Assert
            expect(result).toBe('<CustomFormat: test data>');
        });
    });
});
