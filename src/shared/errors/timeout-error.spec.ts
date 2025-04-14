/**
 * Imports
 */

import { TimeoutError } from '@shared/errors/timeout.error';
import { ExecutionError } from '@shared/errors/execution.error';

/**
 * Tests
 */

describe('TimeoutError', () => {
    describe('constructor', () => {
        test('should create an instance with the correct properties', () => {
            // Arrange
            const timeout = 5000;
            const at = 'testOperation';

            // Act
            const error = new TimeoutError(timeout, at);

            // Assert
            expect(error).toBeInstanceOf(TimeoutError);
            expect(error).toBeInstanceOf(ExecutionError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('xJetTimeoutError');
            expect(error.message).toBe(`Exceeded timeout of ${timeout} ms at ${at}`);
        });

        test('should format the message correctly with different values', () => {
            // Arrange & Act
            const error1 = new TimeoutError(1000, 'functionA');
            const error2 = new TimeoutError(500, 'longRunningProcess');

            // Assert
            expect(error1.message).toBe('Exceeded timeout of 1000 ms at functionA');
            expect(error2.message).toBe('Exceeded timeout of 500 ms at longRunningProcess');
        });
    });

    describe('stack trace', () => {
        test('should have a stack trace', () => {
            // Arrange & Act
            const error = new TimeoutError(2000, 'operation');

            // Assert
            expect(error.stack).toBeDefined();
        });
    });

    describe('serialization', () => {
        test('should be serializable to JSON with all properties', () => {
            // Arrange
            const timeout = 1500;
            const at = 'apiCall';
            const error = new TimeoutError(timeout, at);

            // Act
            const serialized = JSON.parse(JSON.stringify(error));

            // Assert
            expect(serialized).toHaveProperty('name', 'xJetTimeoutError');
            expect(serialized).toHaveProperty('message', `Exceeded timeout of ${timeout} ms at ${at}`);
        });
    });

    describe('usage in async contexts', () => {
        test('should be catchable in try/catch blocks', async () => {
            // Arrange
            const mockAsyncOperation = async () => {
                throw new TimeoutError(1000, 'asyncOperation');
            };

            // Act & Assert
            try {
                await mockAsyncOperation();
                fail('Should have thrown a TimeoutError');
            } catch (error) {
                expect(error).toBeInstanceOf(TimeoutError);
                expect((<TimeoutError> error).message).toBe('Exceeded timeout of 1000 ms at asyncOperation');
            }
        });

        test('should work correctly with Promise.reject', async () => {
            // Arrange
            const error = new TimeoutError(2000, 'promiseOperation');

            // Act & Assert
            await expect(Promise.reject(error)).rejects.toThrow(TimeoutError);
            await expect(Promise.reject(error)).rejects.toHaveProperty('name', 'xJetTimeoutError');
        });
    });
});
