/**
 * Imports
 */

import EventEmitter from 'events';
import { xJetError } from '@errors/xjet.error';
import { BaseTarget } from '@targets/base.target';
import { decodeSchema } from '@schema/action.schema';
import { AsyncQueueService } from '@services/async-queue.service';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@errors/xjet.error');
jest.mock('@schema/action.schema');
jest.mock('@errors/vm-runtime.error');
jest.mock('@services/async-queue.service');

/**
 * Create a concrete implementation for testing
 */

class TestTarget extends BaseTarget {
    initTarget = jest.fn().mockResolvedValue(undefined);
    executeSuites = jest.fn().mockResolvedValue(undefined);
    getRunnerName = jest.fn().mockReturnValue('test-runner');

    // Expose protected methods for testing
    public exposeDispatch(buffer: Buffer): void {
        return this.dispatch(buffer);
    }

    public exposeGenerateId(): string {
        return this.generateId();
    }
}

/**
 * Tests
 */

describe('BaseTarget', () => {
    let target: TestTarget;
    let mockConfig: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup test configuration
        mockConfig = {
            parallel: 4
        };

        // Create test target instance
        target = new TestTarget(mockConfig);

        // Mock EventEmitter methods
        jest.spyOn(target['eventEmitter'], 'on');
        jest.spyOn(target['eventEmitter'], 'emit');
    });

    describe('constructor', () => {
        test('should initialize with the provided configuration', () => {
            expect(target['config']).toBe(mockConfig);
            expect(AsyncQueueService).toHaveBeenCalledWith(mockConfig.parallel);
        });

        test('should initialize maps and event emitter', () => {
            expect(target.suites).toBeInstanceOf(Map);
            expect(target['runningSuites']).toBeInstanceOf(Map);
            expect(target['eventEmitter']).toBeInstanceOf(EventEmitter);
        });
    });

    describe('numberActiveTask', () => {
        test('should return the queue size', () => {
            const mockQueueSize = 3;
            (<any> target['queue']).size = mockQueueSize;

            expect(target.numberActiveTask).toBe(mockQueueSize);
        });
    });

    describe('on', () => {
        test('should register event listeners and return this', () => {
            const mockListener = jest.fn();

            const result = target.on('log', mockListener);

            expect(target['eventEmitter'].on).toHaveBeenCalledWith('log', mockListener);
            expect(result).toBe(target);
        });
    });

    describe('generateId', () => {
        test('should generate a string of expected length', () => {
            const id = target.exposeGenerateId();

            expect(typeof id).toBe('string');
            expect(id.length).toBe(14);
        });

        test('should generate different ids on subsequent calls', () => {
            const id1 = target.exposeGenerateId();
            const id2 = target.exposeGenerateId();

            expect(id1).not.toBe(id2);
        });
    });

    describe('dispatch', () => {
        let mockBuffer: Buffer;

        beforeEach(() => {
            mockBuffer = Buffer.from('test');

            // Mock the decodeSchema function
            (decodeSchema as jest.Mock).mockImplementation(() => ({
                type: SchemaType.LOG,
                suiteId: 'test-suite-123',
                runnerId: 'runner-456'
            }));

            // Mock the suite
            const mockSuite = { id: 'test-suite-123' };
            target.suites.set('test-suite-123', mockSuite as any);
        });

        test('should handle LOG schema type', () => {
            (decodeSchema as jest.Mock).mockReturnValue({
                type: SchemaType.LOG,
                suiteId: 'test-suite-123',
                runnerId: 'runner-456'
            });

            target.exposeDispatch(mockBuffer);

            expect(target['eventEmitter'].emit).toHaveBeenCalledWith('log', expect.any(Object), expect.any(Object));
        });

        test('should handle ACTION schema type', () => {
            (decodeSchema as jest.Mock).mockReturnValue({
                type: SchemaType.ACTION,
                suiteId: 'test-suite-123',
                runnerId: 'runner-456'
            });

            target.exposeDispatch(mockBuffer);

            expect(target['eventEmitter'].emit).toHaveBeenCalledWith('action', expect.any(Object), expect.any(Object));
        });

        test('should handle ERROR schema type', () => {
            const mockError = { message: 'Test error' };
            jest.spyOn(target['eventEmitter'], 'emit').mockReturnValue(true);

            (decodeSchema as jest.Mock).mockReturnValue({
                type: SchemaType.ERROR,
                suiteId: 'test-suite-123',
                runnerId: 'runner-456',
                error: JSON.stringify(mockError)
            });

            target.exposeDispatch(mockBuffer);

            expect(target['eventEmitter'].emit).toHaveBeenCalledWith(
                'error',
                {
                    type: SchemaType.ERROR,
                    suiteId: 'test-suite-123',
                    runnerId: 'runner-456',
                    error: JSON.stringify(mockError)
                },
                expect.anything()
            );
        });

        test('should handle STATUS schema type', () => {
            (decodeSchema as jest.Mock).mockReturnValue({
                type: SchemaType.STATUS,
                suiteId: 'test-suite-123',
                runnerId: 'runner-456'
            });

            target.exposeDispatch(mockBuffer);
            expect(target['eventEmitter'].emit).toHaveBeenCalledWith(
                'status',
                {
                    type: SchemaType.STATUS,
                    suiteId: 'test-suite-123',
                    runnerId: 'runner-456'
                },
                expect.any(Object)
            );
        });

        test('should handle invalid schema type', () => {
            jest.spyOn(target['eventEmitter'], 'emit').mockReturnValue(true);
            (decodeSchema as jest.Mock).mockReturnValue({
                type: 'INVALID_TYPE',
                suiteId: 'test-suite-123',
                runnerId: 'runner-456'
            });

            expect(() => target.exposeDispatch(mockBuffer)).toThrow(xJetError);
        });

        test('should handle errors during dispatch', () => {
            const mockError = new Error('Decoding test error');
            (decodeSchema as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            expect(() => target.exposeDispatch(mockBuffer)).toThrow(mockError);
        });
    });

    /**
     * Tests for suite termination and completion methods
     */
    describe('Suite management methods', () => {
        let target: TestTarget;
        let mockConfig: any;
        let mockReject: jest.Mock;
        let mockResolve: jest.Mock;

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock suite callback functions
            mockReject = jest.fn();
            mockResolve = jest.fn();

            // Setup test configuration with various bail settings
            mockConfig = {
                parallel: 4,
                bail: false
            };

            // Create test target instance
            target = new TestTarget(mockConfig);

            // Mock EventEmitter methods
            jest.spyOn(target['eventEmitter'], 'emit');
        });

        describe('tryTerminateSuite', () => {
            test('should not reject suite when bail is disabled', () => {
                // Setup running suite with bail disabled
                target['runningSuites'].set('suite-123', { resolve: mockResolve, reject: mockReject });

                // Call the method
                (target as any).completeSuite('suite-123', true);

                // Verify suite wasn't terminated
                expect(mockReject).not.toHaveBeenCalled();
                expect(target['runningSuites'].has('suite-123')).toBe(false);
            });

            test('should terminate suite when bail is enabled', () => {
                // Setup running suite with bail enabled
                target['config'].bail = true;
                target['runningSuites'].set('suite-456', { resolve: mockResolve, reject: mockReject });

                // Call the method
                (target as any).completeSuite('suite-456', true);

                // Verify suite was terminated
                expect(mockReject).toHaveBeenCalledTimes(1);
                expect(target['runningSuites'].has('suite-456')).toBe(false);
            });

            test('should do nothing when suite ID is not found', () => {
                // Call with non-existent suite ID
                (target as any).completeSuite('non-existent', true);

                // Verify no actions were taken
                expect(mockReject).not.toHaveBeenCalled();
                expect(target['eventEmitter'].emit).not.toHaveBeenCalled();
            });
        });

        describe('completeSuite', () => {
            beforeEach(() => {
                // Expose the protected method for testing
                (target as any).completeSuite = (<any> TestTarget.prototype).completeSuite.bind(target);
            });

            test('should resolve suite without errors', () => {
                // Setup running suite
                target['runningSuites'].set('suite-123', { resolve: mockResolve, reject: mockReject });

                // Call the method
                (target as any).completeSuite('suite-123', false);

                // Verify suite was resolved correctly
                expect(mockResolve).toHaveBeenCalledTimes(1);
                expect(mockReject).not.toHaveBeenCalled();
                expect(target['runningSuites'].has('suite-123')).toBe(false);
            });

            test('should reject suite with errors when bail is enabled', () => {
                // Setup running suite with bail enabled
                target['config'].bail = true;
                target['runningSuites'].set('suite-456', { resolve: mockResolve, reject: mockReject });

                // Call the method with error flag
                (target as any).completeSuite('suite-456', true);

                // Verify suite was rejected
                expect(mockReject).toHaveBeenCalledTimes(1);
                expect(mockResolve).not.toHaveBeenCalled();
                expect(target['runningSuites'].has('suite-456')).toBe(false);
            });

            test('should resolve suite with errors when bail is disabled', () => {
                // Setup running suite with bail disabled
                target['runningSuites'].set('suite-789', { resolve: mockResolve, reject: mockReject });

                // Call the method with error flag
                (target as any).completeSuite('suite-789', true);

                // Verify suite was still resolved
                expect(mockResolve).toHaveBeenCalledTimes(1);
                expect(mockReject).not.toHaveBeenCalled();
                expect(target['runningSuites'].has('suite-789')).toBe(false);
            });

            test('should do nothing when suite ID is not found', () => {
                // Call with non-existent suite ID
                (target as any).completeSuite('non-existent', false);

                // Verify no actions were taken
                expect(mockResolve).not.toHaveBeenCalled();
                expect(mockReject).not.toHaveBeenCalled();
                expect(target['eventEmitter'].emit).not.toHaveBeenCalled();
            });
        });
    });
});
