/**
 * Imports
 */

import {
    log,
    info,
    warn,
    error,
    debug,
    createLogHandler
} from '@shared/components/log.component';
import { encodeSchema } from '@schema/action.schema';
import { SchemaType } from '@schema/constants/action-schema.constants';
import { LogLevel } from '@shared/components/constants/log-component.constants';

/**
 * Mock dependencies
 */

global.dispatch = jest.fn();
jest.mock('@schema/action.schema', () => ({
    encodeSchema: jest.fn((type, data) => ({ type, data }))
}));

jest.mock('@shared/components/location.component', () => ({
    getInvocationLocation: jest.fn().mockReturnValue({ line: 1, column: 1 })
}));

/**
 * Tests
 */

describe('Logging Utilities', () => {
    describe('createLogHandler', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock Date.toISOString
            const mockDate = new Date('2023-01-01T12:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
        });

        test('should create a handler that dispatches log events with correct level', () => {
            // Arrange
            const logHandler = createLogHandler('INFO');

            // Act
            logHandler('Test message');

            // Assert
            expect(encodeSchema).toHaveBeenCalledWith(SchemaType.LOG, {
                level: LogLevel.INFO,
                context: '',
                location: { line: 1, column: 1 },
                timestamp: '2023-01-01T12:00:00.000Z',
                description: 'Test message'
            });
            expect(dispatch).toHaveBeenCalledWith({
                data: {
                    level: LogLevel.INFO,
                    context: '',
                    location: { line: 1, column: 1 },
                    timestamp: '2023-01-01T12:00:00.000Z',
                    description: 'Test message'
                },
                type: SchemaType.LOG
            });
        });

        test('should format multiple arguments correctly', () => {
            // Arrange
            const logHandler = createLogHandler('ERROR');
            const error = new Error('Something broke');

            // Act
            logHandler('Failed operation:', error, { id: 123 });

            // Assert
            expect(encodeSchema).toHaveBeenCalledWith(SchemaType.LOG, {
                level: LogLevel.ERROR,
                context: '',
                location: { line: 1, column: 1 },
                timestamp: '2023-01-01T12:00:00.000Z',
                description: expect.stringContaining('Failed operation:')
            });
            // The description should include formatted versions of all arguments
            const callArgs = (<any>encodeSchema).mock.calls[0][1];
            expect(callArgs.description).toContain('Failed operation:');
            expect(callArgs.description).toContain('Something broke');
            expect(callArgs.description).toContain('123');
        });
    });

    describe('Exported log functions', () => {
        test('should have all standard log functions available', () => {
            expect(typeof log).toBe('function');
            expect(typeof info).toBe('function');
            expect(typeof warn).toBe('function');
            expect(typeof error).toBe('function');
            expect(typeof debug).toBe('function');
        });
    });
});
