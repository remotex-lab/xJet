/**
 * Import will remove at compile time
 */

import type {
    LogSchemaInterface,
    ErrorSchemaInterface,
    StatusSchemaInterface,
    ActionSchemaInterface
} from '@schema/interfaces/action-schema.interface';

/**
 * Imports
 */

import { SchemaType } from '@schema/constants/action-schema.constants';
import { decodeSchema, encodeErrorSchema, encodeSchema, headerSchema } from '@schema/action.schema';

/**
 * Mock dependencies
 */

global.__XJET = {
    runtime: {
        suiteId: 'tests-suite-id',
        runnerId: 'test-runner-id'
    }
} as any;

/**
 * Tests
 */


describe('Schema encoding and decoding', () => {
    beforeEach(() => {
        // Reset any mocks or setup before each test
    });

    describe('encodeSchema', () => {
        test('should encode a LOG schema correctly', () => {
            const logData = {
                level: 1, // INFO level
                context: '',
                timestamp: '2023-01-01T12:00:00Z',
                description: 'Test log message'
            };

            const buffer = encodeSchema(SchemaType.LOG, logData);

            // Verify buffer is not empty
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Decode and verify the content
            const decoded = decodeSchema<LogSchemaInterface>(buffer);
            expect(decoded.type).toBe(SchemaType.LOG);
            expect(decoded.suiteId).toBe('tests-suite-id');
            expect(decoded.runnerId).toBe('test-runner-id');
            expect(decoded.level).toBe(logData.level);
            expect(decoded.timestamp).toBe(logData.timestamp);
            expect(decoded.description).toBe(logData.description);
        });

        test('should encode an ERROR schema correctly', () => {
            const errorData = {
                error: JSON.stringify({ message: 'Test error' })
            };

            const buffer = encodeSchema(SchemaType.ERROR, errorData);

            // Verify buffer is not empty
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Decode and verify the content
            const decoded = decodeSchema<ErrorSchemaInterface>(buffer);
            expect(decoded.type).toBe(SchemaType.ERROR);
            expect(decoded.suiteId).toBe('tests-suite-id');
            expect(decoded.runnerId).toBe('test-runner-id');
            expect(decoded.error).toBe(errorData.error);
        });

        test('should encode a STATUS schema correctly', () => {
            const statusData = {
                kind: 1,
                action: 2,
                ancestry: 'parent-info',
                description: 'Test status'
            };

            const buffer = encodeSchema(SchemaType.STATUS, statusData);

            // Verify buffer is not empty
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Decode and verify the content
            const decoded = decodeSchema<StatusSchemaInterface>(buffer);
            expect(decoded.type).toBe(SchemaType.STATUS);
            expect(decoded.suiteId).toBe('tests-suite-id');
            expect(decoded.runnerId).toBe('test-runner-id');
            expect(decoded.kind).toBe(statusData.kind);
            expect(decoded.action).toBe(statusData.action);
            expect(decoded.ancestry).toBe(statusData.ancestry);
            expect(decoded.description).toBe(statusData.description);
        });

        test('should encode an ACTION schema correctly', () => {
            const actionData = {
                errors: 'test errors',
                duration: 1000,
                location: {
                    line: 42,
                    column: 10
                },
                kind: 1,
                action: 2,
                ancestry: 'parent-info',
                description: 'Test action'
            };

            const buffer = encodeSchema(SchemaType.ACTION, actionData);

            // Verify buffer is not empty
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Decode and verify the content
            const decoded = decodeSchema<ActionSchemaInterface>(buffer);
            expect(decoded.type).toBe(SchemaType.ACTION);
            expect(decoded.suiteId).toBe('tests-suite-id');
            expect(decoded.runnerId).toBe('test-runner-id');
            expect(decoded.errors).toBe(actionData.errors);
            expect(decoded.duration).toBe(actionData.duration);
            expect(decoded.location).toEqual(actionData.location);
            expect(decoded.kind).toBe(actionData.kind);
            expect(decoded.action).toBe(actionData.action);
            expect(decoded.ancestry).toBe(actionData.ancestry);
            expect(decoded.description).toBe(actionData.description);
        });

        test('should handle empty strings in optional fields', () => {
            // Arrange
            const logData: LogSchemaInterface = {
                level: 1,
                context: '',
                location: { line: 0, column: 0 },
                timestamp: new Date().toISOString(),
                description: 'Test log message'
            };

            // Act
            const buffer = encodeSchema(SchemaType.LOG, logData);

            // Assert
            expect(buffer).toBeInstanceOf(Buffer);

            // Decode to verify
            const decoded = decodeSchema<LogSchemaInterface>(buffer);
            expect(decoded).toEqual({
                type: 0,
                suiteId: 'tests-suite-id',
                runnerId: 'test-runner-id',
                ...logData
            });
        });
    });

    describe('decodeSchema', () => {
        test('should throw an error for invalid schema type', () => {
            // Create a buffer with an invalid schema type
            const invalidHeader = headerSchema.toBuffer(<any>{
                type: 99, // Invalid type
                suiteId: 'test-suite-id',
                runnerId: 'test-runner-id'
            });

            expect(() => decodeSchema(invalidHeader)).toThrow('Invalid schema type: 99');
        });

        test.each([
            [
                SchemaType.LOG,
                {
                    data: 'test data',
                    level: 1,
                    timestamp: '2023-01-01T12:00:00Z',
                    description: 'Test log message'
                }
            ],
            [
                SchemaType.ERROR,
                {
                    error: JSON.stringify({ message: 'Test error' })
                }
            ],
            [
                SchemaType.STATUS,
                {
                    kind: 1,
                    action: 2,
                    ancestry: 'parent-info',
                    description: 'Test status'
                }
            ],
            [
                SchemaType.ACTION,
                {
                    errors: 'test errors',
                    duration: 1000,
                    location: {
                        line: 42,
                        column: 10
                    },
                    kind: 1,
                    action: 2,
                    ancestry: 'parent-info',
                    description: 'Test action'
                }
            ]
        ])('should decode %p schema type correctly', (type, mockData: any) => {
            const buffer = encodeSchema(type, mockData);
            const decoded = decodeSchema(buffer);

            expect(decoded.type).toBe(type);
            expect(decoded.suiteId).toBe('tests-suite-id');
            expect(decoded.runnerId).toBe('test-runner-id');
        });
    });

    describe('encodeErrorSchema', () => {
        test('should encode an Error object correctly', () => {
            const testError = new Error('Test error message');
            const suiteId = 'error-suite-id';
            const runnerId = 'erro-runner-id';

            const buffer = encodeErrorSchema(testError, suiteId, runnerId);

            // Verify buffer is not empty
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Decode and verify the content
            const decoded = decodeSchema<ErrorSchemaInterface>(buffer);
            expect(decoded.type).toBe(SchemaType.ERROR);
            expect(decoded.suiteId).toBe(suiteId);
            expect(decoded.runnerId).toBe(runnerId);

            // Parse the error JSON to check contents
            const errorObj = JSON.parse(decoded.error);
            expect(errorObj).toHaveProperty('message', 'Test error message');
            expect(errorObj).toHaveProperty('name', 'Error');
        });

        test('should handle missing suite and runner IDs', () => {
            const testError = new Error('Test error message');

            // Pass null/undefined for IDs to test the fallback to empty strings
            const buffer = encodeErrorSchema(testError, null as any, undefined as any);

            const decoded = decodeSchema(buffer);
            expect(decoded.suiteId).toBe('\0'.repeat(14));
            expect(decoded.runnerId).toBe('\0'.repeat(14));
        });
    });

    describe('Round Trip Encoding/Decoding', () => {
        test('should correctly round-trip a log schema', () => {
            // Arrange
            const originalData: LogSchemaInterface = {
                level: 1,
                context: '',
                timestamp: new Date().toISOString(),
                description: 'Complex log message with unicode: 你好'
            };

            // Act
            const buffer = encodeSchema(SchemaType.LOG, originalData);
            const decoded = decodeSchema<LogSchemaInterface>(buffer);

            // Assert
            expect(decoded.level).toBe(originalData.level);
            expect(decoded.description).toBe(originalData.description);
        });

        test('should correctly round-trip an action schema', () => {
            // Arrange
            const originalData: ActionSchemaInterface = {
                kind: 1,
                action: 1,
                description: 'Test with special chars: !@#$%^&*()',
                ancestry: 'parent1:12,parent2:34',
                errors: JSON.stringify([{ message: 'Error 1' }, { message: 'Error 2' }]),
                duration: 999,
                location: {
                    line: 9999,
                    column: 8888
                }
            };

            // Act
            const buffer = encodeSchema(SchemaType.ACTION, originalData);
            const decoded = decodeSchema<ActionSchemaInterface>(buffer);

            // Assert
            expect(decoded.action).toBe(originalData.action);
            expect(decoded.description).toBe(originalData.description);
            expect(decoded.ancestry).toBe(originalData.ancestry);
            expect(decoded.errors).toBe(originalData.errors);
            expect(decoded.duration).toBe(originalData.duration);
            expect(decoded.location).toEqual(originalData.location);
        });
    });
});
