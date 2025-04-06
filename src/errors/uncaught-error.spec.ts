/**
 * Imports
 */

import '@errors/uncaught.error';

/**
 * Tests
 */

describe('Global error handlers', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;
    let uncaughtExceptionHandler: (error: Error) => void;
    let unhandledRejectionHandler: (reason: Error) => void;

    beforeEach(() => {
        // Spy on console.error and process.exit
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

        // Store original handlers
        const listeners = process.listeners('uncaughtException');
        uncaughtExceptionHandler = listeners[listeners.length - 1] as (error: Error) => void;

        const rejectionListeners = process.listeners('unhandledRejection');
        unhandledRejectionHandler = rejectionListeners[rejectionListeners.length - 1] as (reason: Error) => void;
    });

    afterEach(() => {
        // Restore the original implementations
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('uncaughtException handler', () => {
        test('should log the error and exit with code 1', () => {
            // Arrange
            const testError = new Error('Test uncaught exception');

            // Act
            uncaughtExceptionHandler(testError);

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('unhandledRejection handler', () => {
        test('should log the rejection reason and exit with code 2', () => {
            // Arrange
            const testReason = new Error('Test unhandled rejection');

            // Act
            unhandledRejectionHandler(testReason);

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith(testReason);
            expect(processExitSpy).toHaveBeenCalledWith(2);
        });
    });

    describe('integration tests', () => {
        test('should handle different error types appropriately', () => {
            // Arrange
            const stringError = 'string error';
            const objectError = { message: 'object error' };

            // Act & Assert - String error for uncaughtException
            uncaughtExceptionHandler(stringError as any);
            expect(consoleErrorSpy).toHaveBeenCalledWith(stringError);
            expect(processExitSpy).toHaveBeenCalledWith(1);

            // Act & Assert - Object error for unhandledRejection
            unhandledRejectionHandler(objectError as any);
            expect(consoleErrorSpy).toHaveBeenCalledWith(objectError);
            expect(processExitSpy).toHaveBeenCalledWith(2);
        });
    });
});
