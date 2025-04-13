/**
 * Imports
 */

import { xJetError } from '@errors/xjet.error';
import { BaseTarget } from '@targets/base.target';
import { SourceService } from '@remotex-labs/xmap';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { ExternalTarget } from '@targets/external.target';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Mock dependencies
 */

jest.mock('@remotex-labs/xmap');
jest.mock('@errors/vm-runtime.error');
jest.mock('@providers/framework.provider');

/**
 * Tests
 */

describe('ExternalTarget', () => {
    // Test fixtures
    const mockRunner = {
        id: '',
        dispatch: jest.fn().mockResolvedValue(undefined),
        connection: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined)
    };

    const mockConfig: any = {
        testRunners: [ mockRunner ],
        seed: 123,
        bail: false,
        filter: 'test',
        timeout: 5000
    };

    let externalTarget: any;

    beforeEach(() => {
        jest.clearAllMocks();
        (FrameworkProvider.getInstance as jest.Mock).mockReturnValue({
            paths: { root: '/test/root' },
            configuration: {},
            isFrameworkSourceFile: jest.fn().mockReturnValue(false)
        });

        externalTarget = new ExternalTarget(mockConfig);

        // Mock internal methods
        externalTarget.generateId = jest.fn().mockReturnValue('test-id');
        externalTarget.queue = {
            enqueue: jest.fn().mockReturnValue(Promise.resolve()),
            start: jest.fn(),
            stop: jest.fn(),
            clear: jest.fn()
        };
        externalTarget.suites = new Map();
        externalTarget.runningSuites = new Map();
        externalTarget.dispatch = jest.fn();
        externalTarget.eventEmitter = {
            emit: jest.fn()
        };
    });

    describe('constructor', () => {
        test('should throw an error if testRunners are not defined in config', () => {
            expect(() => new ExternalTarget({ ...mockConfig, testRunners: undefined }))
                .toThrow(xJetError);
        });

        test('should initialize correctly with valid config', () => {
            expect(externalTarget).toBeInstanceOf(BaseTarget);
            expect(externalTarget.runners).toBeInstanceOf(Map);
        });
    });

    describe('initTarget', () => {
        test('should initialize all test runners', async () => {
            await externalTarget.initTarget();

            expect(mockRunner.connection).toHaveBeenCalled();
            expect(mockRunner.id).toBe('test-id');
            expect(externalTarget.runners.size).toBe(1);
            expect(externalTarget.runners.get('test-id')).toBe(mockRunner);
        });

        test('should log error but continue if a runner fails to initialize', async () => {
            console.error = jest.fn();
            mockRunner.connection.mockRejectedValueOnce(new Error('Connection error'));

            await externalTarget.initTarget();

            expect(console.error).toHaveBeenCalled();
            expect(externalTarget.runners.size).toBe(0);
        });
    });

    describe('executeSuites', () => {
        const mockTranspileFiles = {
            '/test/file.js': {
                code: 'console.log("test");',
                sourceMap: {}
            }
        };

        beforeEach(() => {
            externalTarget.runners.set('test-id', mockRunner);
            externalTarget.executeTestWithErrorHandling = jest.fn().mockResolvedValue(undefined);
            externalTarget['disconnectAllRunners'] = jest.fn();
        });

        test('should queue test execution for each file and runner', async () => {
            await externalTarget.executeSuites(mockTranspileFiles);

            expect(externalTarget.queue.start).toHaveBeenCalled();
            expect(externalTarget.queue.enqueue).toHaveBeenCalledTimes(1);
            expect(externalTarget.disconnectAllRunners).toHaveBeenCalled();
        });
    });

    describe('disconnectAllRunners', () => {
        beforeEach(() => {
            console.error = jest.fn();
            externalTarget.runners.set('test-id', mockRunner);
        });

        test('should disconnect all runners', async () => {
            await externalTarget['disconnectAllRunners']();

            expect(mockRunner.disconnect).toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        test('should log errors if a runner fails to disconnect', async () => {
            mockRunner.disconnect.mockRejectedValueOnce(new Error('Disconnect error'));

            await externalTarget['disconnectAllRunners']();

            expect(console.error).toHaveBeenCalled();
            expect(VMRuntimeError).toHaveBeenCalled();
        });
    });

    describe('executeTestWithErrorHandling', () => {
        test('should reject with undefined when execution fails and bail is true', async () => {
            // Arrange
            const mockSourceService = new SourceService(<any> {}, '');
            const testError = new Error('Test execution error');
            externalTarget.executeInRunner = jest.fn().mockRejectedValue(testError);
            externalTarget.config.bail = true;

            // Act
            const promise = externalTarget.executeTestWithErrorHandling(
                'test code',
                'test/file.js',
                mockSourceService,
                mockRunner
            );

            // Assert
            await expect(promise).rejects.toBeUndefined();
            expect(externalTarget.eventEmitter.emit).toHaveBeenCalledTimes(1);
        });

        test('should resolve with undefined when execution fails and bail is false', async () => {
            // Arrange
            const mockSourceService = new SourceService(<any> {}, '');
            const testError = new Error('Test execution error');
            externalTarget.executeInRunner = jest.fn().mockRejectedValue(testError);
            externalTarget.config.bail = false;

            // Act
            const promise = externalTarget.executeTestWithErrorHandling(
                'test code',
                'test/file.js',
                mockSourceService,
                mockRunner
            );

            // Assert
            await expect(promise).resolves.toBeUndefined();
            expect(externalTarget.eventEmitter.emit).toHaveBeenCalledTimes(1);
        });

        test('should resolve with undefined when execution succeeds', async () => {
            // Arrange
            const mockSourceService = new SourceService(<any> {}, '');
            externalTarget.executeInRunner = jest.fn().mockImplementationOnce(() => {
                throw new Error('Dispatch error');
            });

            // Act
            const promise = externalTarget.executeTestWithErrorHandling(
                'test code',
                'test/file.js',
                mockSourceService,
                mockRunner
            );

            // Assert
            await expect(promise).resolves.toBeUndefined();
            expect(externalTarget.executeInRunner).toHaveBeenCalledWith(
                'test code',
                'test/file.js',
                'test-id',
                mockRunner
            );
            expect(externalTarget.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('executeInRunner', () => {
        test('should prepare test code with context and dispatch to runner', async () => {
            externalTarget['prepareTestCodeWithContext'] = jest.fn().mockReturnValue('prepared code');

            await externalTarget['executeInRunner'](
                'test code',
                'test/file.js',
                'suite-id',
                mockRunner
            );

            expect(externalTarget['prepareTestCodeWithContext']).toHaveBeenCalledWith(
                'test code',
                expect.objectContaining({
                    suiteId: 'suite-id',
                    runnerId: mockRunner.id,
                    relativePath: 'test/file.js'
                })
            );

            expect(mockRunner.dispatch).toHaveBeenCalledWith(Buffer.from('prepared code'), 'suite-id');
        });
    });

    describe('prepareTestCodeWithContext', () => {
        test('should inject runtime context into test code', () => {
            const context = { test: true, value: 123 };
            const result = externalTarget['prepareTestCodeWithContext']('console.log("test");', context);

            expect(result).toBe(`const __XJET = { runtime: ${JSON.stringify(context)} }; console.log("test");`);
        });
    });
});
