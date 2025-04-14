/**
 * Imports
 */

import { MessageHandler } from '@handler/message.handler';
import { LogLevel } from '@shared/components/constants/log-component.constants';
import { StatusType, KindType, ActionType } from '@handler/constants/message-handler.constant';

/**
 * Mock dependencies
 */

jest.mock('path', () => ({
    join: jest.fn((path) => `mocked-dirname-${ path }`),
    dirname: jest.fn((path) => `mocked-dirname-${ path }`),
    relative: jest.fn((root, path) => `mocked-relative-${ path }`)
}));


jest.mock('@components/stack.component', () => ({
    getStackMetadata: jest.fn(),
    highlightPositionCode: jest.fn()
}));

/**
 * Tests
 */

describe('MessageHandler', () => {
    let messageHandler: MessageHandler;
    let mockTarget: any;
    let mockReporter: any;

    beforeEach(() => {
        // Setup mocks
        mockTarget = {
            completeSuite: jest.fn()
        };
        mockReporter = {
            log: jest.fn(),
            init: jest.fn(),
            status: jest.fn(),
            action: jest.fn(),
            suiteError: jest.fn()
        };

        // Create instance
        messageHandler = new MessageHandler(mockTarget, mockReporter);

        // Mock process.env and cwd
        process.env.INIT_CWD = '/mocked/init/cwd';
        jest.spyOn(process, 'cwd').mockReturnValue('/mocked/cwd');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handlePendingSuite', () => {
        test('should log relative paths of pending suites', () => {
            // Arrange
            const paths = [ '/path/to/suite1', '/path/to/suite2' ];

            // Act
            messageHandler.handlePendingSuite(paths, -1);

            // Assert
            expect(mockReporter.init).toHaveBeenCalledWith([
                'mocked-relative-/path/to/suite1',
                'mocked-relative-/path/to/suite2'
            ], -1);
        });
    });

    describe('handleLog', () => {
        test('should create and log a log message', () => {
            // Arrange
            const mockData: any = {
                level: LogLevel.INFO,
                suiteId: 'suite-123',
                runnerId: 'runner-123',
                timestamp: 1234567890,
                location: { line: 1, column: 1 },
                description: 'Test log message'
            };
            const mockSource: any = { getPosition: jest.fn() };

            // Mock the private createBaseMessage method
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });

            // Act
            messageHandler.handleLog(mockData, mockSource);

            // Assert
            expect((messageHandler as any).createBaseMessage).toHaveBeenCalledWith(mockData, mockSource);
            expect(mockReporter.log).toHaveBeenCalledWith(expect.objectContaining({
                id: 'message-123',
                source: 'test-source',
                type: 'info',
                value: 'Test log message',
                timestamp: 1234567890
            }));
        });
    });

    describe('handleSuiteError', () => {
        test('should parse error, log it, and complete suite with error flag', () => {
            // Arrange
            const mockData: any = {
                error: JSON.stringify({ message: 'Test error' }),
                suiteId: 'suite-123',
                runnerId: 'runner-123'
            };
            const mockSource: any = { /* mock source properties */ };
            const mockParsedError = { parsedError: 'Test parsed error' };

            // Mock private methods
            (messageHandler as any).safeJsonParse = jest.fn().mockReturnValue({ message: 'Test error' });
            (messageHandler as any).parseError = jest.fn().mockReturnValue(mockParsedError);

            // Act
            messageHandler.handleSuiteError(mockData, mockSource);

            // Assert
            expect((messageHandler as any).safeJsonParse).toHaveBeenCalledWith(mockData.error);
            expect((messageHandler as any).parseError).toHaveBeenCalledWith(
                { message: 'Test error' },
                mockSource,
                'runner-123'
            );
            expect(mockReporter.suiteError).toHaveBeenCalledWith(mockParsedError);
            expect(mockTarget.completeSuite).toHaveBeenCalledWith('suite-123', true);
        });
    });

    describe('handleSuiteStatus', () => {
        test('should complete suite when action is END', () => {
            // Arrange
            const mockData: any = {
                action: StatusType.END,
                suiteId: 'suite-123',
                kind: KindType.SUITE,
                ancestry: JSON.stringify([ 'parent', 'child' ]),
                description: 'Test description'
            };
            const mockSource: any = { /* mock source properties */ };

            // Mock private methods
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });
            (messageHandler as any).safeJsonParse = jest.fn().mockReturnValue([ 'parent', 'child' ]);

            // Act
            messageHandler.handleSuiteStatus(mockData, mockSource);

            // Assert
            expect(mockTarget.completeSuite).toHaveBeenCalledWith('suite-123');
            expect(mockReporter.status).toHaveBeenCalledWith(expect.objectContaining({
                id: 'message-123',
                source: 'test-source',
                kind: 'suite',
                status: 'end',
                ancestry: [ 'parent', 'child' ],
                kindNumber: KindType.SUITE,
                description: 'Test description',
                statusNumber: StatusType.END
            }));
        });

        test('should handle other status types without completing suite', () => {
            // Arrange
            const mockData: any = {
                action: StatusType.START,
                suiteId: 'suite-123',
                kind: KindType.TEST,
                ancestry: JSON.stringify([ 'parent', 'child' ]),
                description: 'Test description'
            };
            const mockSource: any = { /* mock source properties */ };

            // Mock private methods
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });
            (messageHandler as any).safeJsonParse = jest.fn().mockReturnValue([ 'parent', 'child' ]);

            // Act
            messageHandler.handleSuiteStatus(mockData, mockSource);

            // Assert
            expect(mockTarget.completeSuite).not.toHaveBeenCalled();
            expect(mockReporter.status).toHaveBeenCalledWith(expect.objectContaining({
                status: 'start',
                kind: 'test'
            }));
        });
    });

    describe('handleSuiteAction', () => {
        test('should create and log an action message with no errors', () => {
            // Arrange
            const mockData: any = {
                kind: KindType.TEST,
                action: ActionType.SUCCESS,
                duration: 100,
                ancestry: JSON.stringify([ 'parent', 'child' ]),
                description: 'Test description',
                suiteId: 'suite-123'
            };
            const mockSource: any = { /* mock source properties */ };

            // Mock private methods
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });
            (messageHandler as any).safeJsonParse = jest.fn().mockReturnValue([ 'parent', 'child' ]);

            // Act
            messageHandler.handleSuiteAction(mockData, mockSource);

            // Assert
            expect(mockReporter.action).toHaveBeenCalledWith(expect.objectContaining({
                id: 'message-123',
                source: 'test-source',
                kind: 'test',
                action: 'success',
                errors: [],
                duration: 100,
                ancestry: [ 'parent', 'child' ],
                kindNumber: KindType.TEST,
                description: 'Test description',
                actionNumber: ActionType.SUCCESS
            }));
        });

        test('should use source filepath when description is missing', () => {
            // Arrange
            const mockData: any = {
                kind: KindType.TEST,
                action: ActionType.SUCCESS,
                duration: 100,
                ancestry: JSON.stringify([ 'parent', 'child' ]),
                description: undefined,
                suiteId: 'suite-123'
            };
            const mockSource: any = { /* mock source properties */ };

            // Mock private methods
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });
            (messageHandler as any).safeJsonParse = jest.fn().mockReturnValue([ 'parent', 'child' ]);
            (messageHandler as any).getFilepath = jest.fn().mockReturnValue('test-filepath');

            // Act
            messageHandler.handleSuiteAction(mockData, mockSource);

            // Assert
            expect((messageHandler as any).getFilepath).toHaveBeenCalledWith(mockSource);
            expect(mockReporter.action).toHaveBeenCalledWith(expect.objectContaining({
                description: 'test-filepath'
            }));
        });

        test('should parse and include errors when present', () => {
            // Arrange
            const mockData: any = {
                kind: KindType.TEST,
                action: ActionType.FAILURE,
                duration: 100,
                ancestry: JSON.stringify([ 'parent', 'child' ]),
                description: 'Test description',
                errors: JSON.stringify([{ message: 'Error 1' }, { message: 'Error 2' }]),
                suiteId: 'suite-123'
            };
            const mockSource: any = { /* mock source properties */ };
            const mockParsedErrors = [
                { parsedError: 'Error 1' },
                { parsedError: 'Error 2' }
            ];

            // Mock private methods
            (messageHandler as any).createBaseMessage = jest.fn().mockReturnValue({
                id: 'message-123',
                source: 'test-source'
            });
            (messageHandler as any).safeJsonParse = jest.fn()
                .mockReturnValueOnce([ 'parent', 'child' ])
                .mockReturnValueOnce([{ message: 'Error 1' }, { message: 'Error 2' }]);
            (messageHandler as any).parseError = jest.fn()
                .mockReturnValueOnce(mockParsedErrors[0])
                .mockReturnValueOnce(mockParsedErrors[1]);

            // Act
            messageHandler.handleSuiteAction(mockData, mockSource);

            // Assert
            expect((messageHandler as any).safeJsonParse).toHaveBeenCalledWith(mockData.errors, []);
            expect(mockReporter.action).toHaveBeenCalledWith(expect.objectContaining({
                errors: mockParsedErrors
            }));
        });
    });
});
