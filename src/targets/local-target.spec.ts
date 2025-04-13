/**
 * Imports
 */

import EventEmitter from 'events';
import { SourceService } from '@remotex-labs/xmap';
import { LocalTarget } from '@targets/local.target';
import { AsyncQueueService } from '@services/async-queue.service';
import { sandboxExecute } from '@services/vm.service';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@services/async-queue.service');
jest.mock('path', () => ({
    relative: jest.fn().mockImplementation(() => 'mocked/relative/path')
}));

jest.mock('@remotex-labs/xmap', () => ({
    SourceService: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@providers/framework.provider', () => ({
    FrameworkProvider: {
        getInstance: jest.fn().mockReturnValue({
            paths: {
                root: '/mock/root/path'
            }
        })
    }
}));

jest.mock('@services/vm.service', () => ({
    sandboxExecute: jest.fn().mockResolvedValue(undefined)
}));

/**
 * Tests
 */

describe('LocalTarget', () => {
    let localTarget: LocalTarget;
    let mockConfig: any;
    let mockEventEmitter: EventEmitter;
    let mockQueueService: jest.Mocked<AsyncQueueService>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockConfig = {
            bail: false,
            filter: null,
            timeout: 5000,
            randomize: true,
            parallelism: 2
        };

        mockEventEmitter = new EventEmitter();
        mockQueueService = new AsyncQueueService(2) as jest.Mocked<AsyncQueueService>;

        // Spy on EventEmitter methods
        jest.spyOn(mockEventEmitter, 'emit').mockReturnValue(true);

        // Setup queue service behavior
        mockQueueService.enqueue = jest.fn().mockImplementation((fn) => fn());
        mockQueueService.start = jest.fn();

        // Create instance with mocked dependencies
        localTarget = new LocalTarget(mockConfig);

        // Set private properties using any type assertion
        (localTarget as any).eventEmitter = mockEventEmitter;
        (localTarget as any).queue = mockQueueService;
        (localTarget as any).runners = new Map();
        (localTarget as any).suites = new Map();
        (localTarget as any).runningSuites = new Map();
        (localTarget as any).dispatch = jest.fn();
    });

    describe('executeSuites', () => {
        test('should process each transpiled file and queue test execution tasks', async () => {
            const mockTranspileFiles: any = {
                '/path/to/test1.ts': {
                    code: 'test code 1',
                    sourceMap: { version: 3, sources: [], mappings: '' }
                },
                '/path/to/test2.ts': {
                    code: 'test code 2',
                    sourceMap: { version: 3, sources: [], mappings: '' }
                }
            };

            // Spy on private method
            const executeTestSpy = jest.spyOn(localTarget as any, 'executeTestWithErrorHandling')
                .mockResolvedValue(undefined);

            await localTarget.executeSuites(mockTranspileFiles);

            // Check if SourceService was created for each file
            expect(SourceService).toHaveBeenCalledTimes(2);

            // Check if queue was started
            expect(mockQueueService.start).toHaveBeenCalledTimes(1);

            // Check if executeTestWithErrorHandling was called for each file
            expect(executeTestSpy).toHaveBeenCalledTimes(2);
            expect(executeTestSpy).toHaveBeenCalledWith(
                'test code 1',
                'mocked/relative/path',
                expect.any(Object)
            );
            expect(executeTestSpy).toHaveBeenCalledWith(
                'test code 2',
                'mocked/relative/path',
                expect.any(Object)
            );
        });
    });

    describe('executeTestWithErrorHandling', () => {
        test('should execute test in sandbox and handle successful execution', async () => {
            // Setup test data
            const testCode = 'test code';
            const testFilePath = 'test-file-path';
            const sourceService = new SourceService({} as any, '');
            const suiteId = 'mock-suite-id';

            // Create mock Maps with spied methods
            const mockSuites = new Map();
            const suiteSetSpy = jest.spyOn(mockSuites, 'set');

            const mockRunningSuites = new Map();
            const runningSuitesSetSpy = jest.spyOn(mockRunningSuites, 'set');

            // Set the maps on the localTarget
            (localTarget as any).suites = mockSuites;
            (localTarget as any).runningSuites = mockRunningSuites;

            // Mock the generateId method to return consistent ID for testing
            jest.spyOn(localTarget as any, 'generateId').mockReturnValue(suiteId);

            // Mock the executeInSandbox method
            const executeInSandboxSpy = jest.spyOn(localTarget as any, 'executeInSandbox')
                .mockImplementation(async () => {
                    // Simulate successful completion of the test
                    (localTarget as any).completeSuite(suiteId, false);
                });

            // Mock the completeSuite method
            jest.spyOn(localTarget as any, 'completeSuite').mockImplementation((id) => {
                const suitePromise = mockRunningSuites.get(id);
                if (suitePromise) {
                    suitePromise.resolve();
                    mockRunningSuites.delete(id);
                }
            });

            // Execute the method under test
            await (localTarget as any).executeTestWithErrorHandling(testCode, testFilePath, sourceService);

            // Verify method behavior
            expect(suiteSetSpy).toHaveBeenCalledWith(suiteId, sourceService);
            expect(runningSuitesSetSpy).toHaveBeenCalledWith(
                suiteId,
                expect.objectContaining({
                    resolve: expect.any(Function),
                    reject: expect.any(Function)
                })
            );
            expect(executeInSandboxSpy).toHaveBeenCalledWith(testCode, testFilePath, suiteId);
            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        test('should catch errors and emit error event', async () => {
            // Make executeInSandbox throw an error
            const mockError = new Error('Test execution failed');
            jest.spyOn(localTarget as any, 'executeInSandbox')
                .mockRejectedValue(mockError);

            const mockSourceService = new SourceService({} as any, '');

            // Mock the runningSuites Map methods
            jest.spyOn((localTarget as any).runningSuites, 'set');

            // Call the method under test
            const result = (localTarget as any).executeTestWithErrorHandling(
                'test code',
                'test/file.js',
                mockSourceService
            );

            // Wait for the promise to resolve
            await result;

            // Check if error was emitted
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                'error',
                {
                    type: SchemaType.ERROR,
                    error: expect.any(String),
                    suiteId: expect.any(String),
                    runnerId: expect.any(String)
                },
                mockSourceService
            );
        });
    });

    describe('executeInSandbox', () => {
        test('should execute code in sandbox with proper context', async () => {
            // Set up the test
            const testCode = 'test code';
            const testFilePath = 'test/file.js';
            const suiteId = 'suite-123';

            // Execute the method
            await (localTarget as any).executeInSandbox(
                testCode,
                testFilePath,
                suiteId
            );

            // Get the actual call arguments
            expect(sandboxExecute).toHaveBeenCalledTimes(1);
            const callArgs = (<any> sandboxExecute).mock.calls[0];

            // Verify first argument (test code)
            expect(callArgs[0]).toBe(testCode);

            // Verify second argument (sandbox context) properties
            const sandboxContext = callArgs[1];
            expect(sandboxContext.Buffer).toBe(Buffer);
            expect(sandboxContext.setTimeout).toBe(setTimeout);
            expect(sandboxContext.setInterval).toBe(setInterval);
            expect(sandboxContext.clearTimeout).toBe(clearTimeout);
            expect(sandboxContext.clearInterval).toBe(clearInterval);
            expect(sandboxContext.dispatch).toBeDefined();

            // Verify XJET runtime configuration
            const runtime = sandboxContext.__XJET.runtime;
            expect(runtime.randomize).toBeTruthy();
            expect(runtime.bail).toBe(false);
            expect(runtime.filter).toBe(null);
            expect(runtime.timeout).toBe(5000);
            expect(runtime.suiteId).toBe(suiteId);
            // Don't check exact runnerId value, as it's dynamically generated
            expect(runtime.runnerId).toBeDefined();
            expect(runtime.relativePath).toBe(testFilePath);

            // Verify third argument (sandbox options)
            expect(callArgs[2]).toEqual({ filename: testFilePath });
        });
    });
});
