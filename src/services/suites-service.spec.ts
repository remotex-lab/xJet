/**
 * Import will remove at compile time
 */

import type { TranspileFileTypes } from '@services/interfaces/transpiler-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { normalize } from 'path';
import { watch } from 'fs/promises';
import { xJetError } from '@errors/xjet.error';
import { LocalTarget } from '@targets/local.target';
import { SuitesService } from '@services/suites.service';
import { SpecsProvider } from '@providers/specs.provider';
import { ExternalTarget } from '@targets/external.target';
import { transpileFiles } from '@services/transpiler.service';
import type { AbstractReporter } from '@reports/abstract.reporter';

/**
 * Mock dependencies
 */

jest.mock('fs/promises');
jest.mock('@handler/message.handler');
const spyExecuteSuites = jest.fn();
jest.mock('@errors/xjet.error', () => ({
    xJetError: Error
}));
jest.mock('@targets/local.target', () => {
    return {
        LocalTarget: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            initTarget: jest.fn(),
            executeSuites: spyExecuteSuites.mockResolvedValue(undefined),
            numberActiveTask: 0
        }))
    };
});

jest.mock('@targets/external.target', () => {
    return {
        ExternalTarget: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            initTarget: jest.fn(),
            executeSuites: jest.fn<any, any>().mockResolvedValue(undefined),
            numberActiveTask: 0
        }))
    };
});

jest.mock('@providers/specs.provider', () => {
    const MockSpecsProvider = jest.fn();
    MockSpecsProvider.prototype.getSpecFiles = jest.fn().mockReturnValue([ 'spec1.ts', 'spec2.ts' ]);

    return {
        SpecsProvider: MockSpecsProvider
    };
});

jest.mock('@services/transpiler.service', () => {
    return {
        transpileFiles: jest.fn<any, any>().mockResolvedValue({
            sources: [ '/mock/path/file1.js', '/mock/path/file2.js' ],
            mapFiles: [ '/mock/path/file1.js.map', '/mock/path/file2.js.map' ],
            entryPoints: [ '/mock/path/entry.js' ]
        })
    };
});

jest.mock('@providers/framework.provider', () => ({
    FrameworkProvider: {
        getInstance: jest.fn().mockReturnValue({
            paths: {
                root: '/mock/root/path',
                dist: '/mock/dist/path'
            },
            isFrameworkSourceFile: jest.fn().mockReturnValue(true)
        })
    }
}));

/**
 * Tests
 */

describe('SuitesService', () => {
    let transpiled: TranspileFileTypes;
    let mockReporter: AbstractReporter;
    let mockConfig: ConfigurationInterface;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Basic configuration
        mockConfig = <any> {
            watch: false,
            build: {
                outDir: 'dist',
                target: 'es2020'
            },
            testRunners: undefined
        } as ConfigurationInterface;

        mockReporter = {

        } as AbstractReporter;

        transpiled = <any> {
            sources: [ '/mock/path/file1.js', '/mock/path/file2.js' ],
            mapFiles: [ '/mock/path/file1.js.map', '/mock/path/file2.js.map' ],
            entryPoints: [ '/mock/path/entry.js' ]
        };
    });

    describe('constructor', () => {
        test('should initialize with local target when testRunners is not configured', () => {
            mockConfig.testRunners = undefined;
            new SuitesService(mockConfig, mockReporter);

            expect(LocalTarget).toHaveBeenCalledWith(mockConfig);
            expect(ExternalTarget).not.toHaveBeenCalled();
            expect(SpecsProvider).toHaveBeenCalledWith(mockConfig);
        });

        test('should initialize with external target when testRunners is configured', () => {
            mockConfig.testRunners = <any> [ 'runner1', 'runner2' ];
            new SuitesService(mockConfig, mockReporter);

            expect(LocalTarget).not.toHaveBeenCalled();
            expect(ExternalTarget).toHaveBeenCalledWith(mockConfig);
        });
    });

    describe('executeSuite', () => {
        test('should transpile files and execute suites without watching', async() => {
            // Setup
            mockConfig.watch = false;
            const suitesService = new SuitesService(mockConfig, mockReporter);

            // Act
            await suitesService.executeSuite();

            // Assert
            expect(SpecsProvider.prototype.getSpecFiles).toHaveBeenCalledWith('/mock/root/path');
            expect(transpileFiles).toHaveBeenCalledWith(
                [ 'spec1.ts', 'spec2.ts' ],
                expect.objectContaining({
                    outDir: 'dist',
                    target: 'es2020',
                    logLevel: 'silent',
                    inject: [ normalize('/mock/dist/path/index.js') ]
                })
            );
            expect(spyExecuteSuites).toHaveBeenCalledWith(transpiled);
        });

        test('should watch for changes when watch mode is enabled', async() => {
            // Setup
            mockConfig.watch = true;
            const mockWatcher = {
                [Symbol.asyncIterator]: jest.fn()
            };
            (watch as jest.MockedFunction<typeof watch>).mockReturnValue(mockWatcher as any);

            const suitesService = new SuitesService(mockConfig, mockReporter);
            const executionPromise = suitesService.executeSuite();

            // Simulate ending the watch process to allow the promise to resolve
            // In real usage, this would be an infinite loop that only ends on error or manual termination
            mockWatcher[Symbol.asyncIterator].mockReturnValue({
                next: jest.fn<any, any>().mockResolvedValue({ done: true, value: undefined })
            });

            await executionPromise;
            expect(transpileFiles).toHaveBeenCalled();
            expect(spyExecuteSuites).toHaveBeenCalledWith(transpiled, true);
        });
    });

    describe('watchForChanges', () => {
        let suitesService: SuitesService;

        beforeEach(() => {
            mockConfig.watch = true;
            suitesService = new SuitesService(mockConfig, mockReporter);
        });

        test('should handle file changes and re-run tests for supported extensions', async () => {
            // Setup
            const mockAsyncIterator = {
                next: jest.fn<any, any>()
                    .mockResolvedValueOnce({ done: false, value: { filename: 'test.ts' } })
                    .mockResolvedValue({ done: true })
            };
            const mockWatcher = {
                [Symbol.asyncIterator]: jest.fn().mockReturnValue(mockAsyncIterator)
            };
            (watch as jest.MockedFunction<typeof watch>).mockReturnValue(mockWatcher as any);

            await (suitesService as any).watchForChanges(transpileFiles);
            expect(spyExecuteSuites).toHaveBeenCalledTimes(2);
        });

        test('should not re-run tests for unsupported file extensions', async () => {
            // Setup
            const mockAsyncIterator = {
                next: jest.fn<any, any>()
                    .mockResolvedValueOnce({ done: false, value: { filename: 'test.css' } })
                    .mockResolvedValue({ done: true })
            };
            const mockWatcher = {
                [Symbol.asyncIterator]: jest.fn().mockReturnValue(mockAsyncIterator)
            };
            (watch as jest.MockedFunction<typeof watch>).mockReturnValue(mockWatcher as any);

            await (suitesService as any).watchForChanges(transpileFiles);
            expect(spyExecuteSuites).toHaveBeenCalledTimes(1);
        });

        test('should throw xJetError when watcher encounters an error', async () => {
            // Setup
            try {
                (watch as jest.MockedFunction<any>).mockRejectedValue(new Error('Watch error'));
            } catch {
                await expect((suitesService as any).watchForChanges(transpileFiles))
                    .rejects.toThrow(xJetError);
            }
        });
    });

    describe('shouldProcessFile', () => {
        let suitesService: SuitesService;

        beforeEach(() => {
            suitesService = new SuitesService(mockConfig, mockReporter);
        });

        test('should return false for null filename', () => {
            expect((suitesService as any).shouldProcessFile(null)).toBe(false);
        });

        test('should return false for unsupported file extensions', () => {
            expect((suitesService as any).shouldProcessFile('file.css')).toBe(false);
            expect((suitesService as any).shouldProcessFile('file.html')).toBe(false);
        });
    });
});
