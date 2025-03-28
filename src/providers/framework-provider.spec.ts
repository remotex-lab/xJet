/**
 * Imports
 */

import * as fs from 'fs';
import * as path from 'path';
import * as constants from 'constants';
import { SourceService } from '@remotex-labs/xmap';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Mock dependencies
 */

jest.mock('fs');
jest.mock('path');
jest.mock('@remotex-labs/xmap');

/**
 * Tests
 */

describe('FrameworkProvider', () => {
    afterAll(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(path, 'basename').mockReturnValue('dist');
        jest.spyOn(path, 'dirname').mockReturnValue('/path/to/dist');
    });

    // Reset the singleton after each test
    afterEach(() => {
        // Access and reset the private static instance
        // Using any to bypass TypeScript's private access restrictions for testing
        (FrameworkProvider as any).instance = undefined;
    });

    describe('getInstance', () => {
        test('should create a singleton instance', () => {
            const instance1 = FrameworkProvider.getInstance();
            const instance2 = FrameworkProvider.getInstance();

            expect(instance1).toBeDefined();
            expect(instance2).toBeDefined();
            expect(instance1).toBe(instance2);
        });
    });

    describe('paths', () => {
        test('should return framework paths', () => {
            const frameworkProvider = FrameworkProvider.getInstance();
            const paths = frameworkProvider.paths;

            expect(paths).toBeDefined();
            expect(paths).toHaveProperty('root');
            expect(paths).toHaveProperty('dist');
            expect(paths).toHaveProperty('framework');
        });
    });

    describe('configuration', () => {
        test('should return configuration source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the configuration using private property access for testing
            // Using any to bypass TypeScript's private access restrictions
            (frameworkProvider as any).configurationSourceMap = mockSourceService;

            expect(frameworkProvider.configuration).toBe(mockSourceService);
        });

        test('should return undefined when configuration source map is not available', () => {
            const frameworkProvider = FrameworkProvider.getInstance();

            // Ensure configuration source map is undefined
            (frameworkProvider as any).configurationSourceMap = undefined;

            expect(frameworkProvider.configuration).toBeUndefined();
        });
    });

    describe('configuration setter', () => {
        test('should set configuration source map service', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const mockSourceService = new SourceService('') as jest.Mocked<SourceService>;

            // Act
            frameworkProvider.configuration = mockSourceService;

            // Assert
            expect(frameworkProvider.configuration).toBe(mockSourceService);
        });

        test('should override existing configuration source map', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const initialMockService = new SourceService('') as jest.Mocked<SourceService>;
            const newMockService = new SourceService('') as jest.Mocked<SourceService>;

            // Act
            frameworkProvider.configuration = initialMockService;
            const initialConfiguration = frameworkProvider.configuration;

            frameworkProvider.configuration = newMockService;
            const updatedConfiguration = frameworkProvider.configuration;

            // Assert
            expect(initialConfiguration).toBe(initialMockService);
            expect(updatedConfiguration).toBe(newMockService);
            expect(initialConfiguration).not.toBe(updatedConfiguration);
        });

        test('should accept undefined to remove configuration source map', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const mockSourceService = new SourceService('') as jest.Mocked<SourceService>;

            // Act - first set a value, then set to undefined
            frameworkProvider.configuration = mockSourceService;
            expect(frameworkProvider.configuration).toBe(mockSourceService);

            frameworkProvider.configuration = <any>undefined;

            // Assert
            expect(frameworkProvider.configuration).toBeUndefined();
        });
    });

    describe('Error handling', () => {
        test('should handle errors when source service initialization fails', () => {
            // Mock SourceService constructor to throw an error
            (SourceService as jest.Mock).mockImplementation(() => {
                throw new Error('Source service initialization failed');
            });

            // This shouldn't throw an error but handle it gracefully
            const frameworkProvider = FrameworkProvider.getInstance();
            expect(frameworkProvider).toBeDefined();
        });
    });

    describe('shared', () => {
        test('should return shared source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the shared source map using private property access for testing
            (frameworkProvider as any).sharedSourceMap = mockSourceService;

            expect(frameworkProvider.shared).toEqual(mockSourceService);
        });
    });

    describe('framework', () => {
        test('should return framework source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the framework source map using private property access for testing
            (frameworkProvider as any).frameworkSourceMap = mockSourceService;

            expect(frameworkProvider.framework).toBe(mockSourceService);
        });
    });

    describe('getDistPath', () => {
        let frameworkProvider: FrameworkProvider;

        beforeEach(() => {
            frameworkProvider = FrameworkProvider.getInstance();

            jest.clearAllMocks();
            jest.spyOn(path, 'parse').mockReturnValue(<any>{ root: '/' });
            jest.spyOn(fs, 'accessSync').mockImplementation(() => {
                throw new Error('Test');
            });
        });

        test('should return current directory when it is already the dist directory', () => {
            // Arrange
            const mockCurrentDir = '/path/to/dist';
            const dirnameSpy = jest.spyOn(path, 'dirname').mockReturnValue(mockCurrentDir);
            const basenameSpy = jest.spyOn(path, 'basename').mockReturnValue('dist');

            // Act
            const result = (frameworkProvider as any).getDistPath();

            // Assert
            expect(result).toBe(mockCurrentDir);
            expect(dirnameSpy).toHaveBeenCalled();
            expect(basenameSpy).toHaveBeenCalledWith(mockCurrentDir);
        });

        test('should find dist directory one level up from current directory', () => {
            // Arrange
            const mockCurrentDir = '/path/to/dist/bin';
            const mockParentDir = '/path/to/dist';

            const dirnameSpy = jest.spyOn(path, 'dirname')
                .mockReturnValueOnce(mockCurrentDir)  // First call for current directory
                .mockReturnValueOnce(mockParentDir);  // Second call when moving up

            const basenameSpy = jest.spyOn(path, 'basename')
                .mockReturnValueOnce('bin')           // First call for current dir
                .mockReturnValueOnce('dist');         // Second call for parent dir

            // Act
            const result = (frameworkProvider as any).getDistPath();

            // Assert
            expect(result).toBe(mockParentDir);
            expect(dirnameSpy).toHaveBeenCalledTimes(2);
            expect(basenameSpy).toHaveBeenCalledTimes(2);
        });

        test('should find dist directory multiple levels up from current directory', () => {
            // Arrange
            const mockCurrentDir = '/path/to/dist/bin/subdir';
            const mockParentDir1 = '/path/to/dist/bin';
            const mockParentDir2 = '/path/to/dist';

            const dirnameSpy = jest.spyOn(path, 'dirname')
                .mockReturnValueOnce(mockCurrentDir)   // First call for current directory
                .mockReturnValueOnce(mockParentDir1)   // Second call
                .mockReturnValueOnce(mockParentDir2);  // Third call

            const basenameSpy = jest.spyOn(path, 'basename')
                .mockReturnValueOnce('subdir')         // First check
                .mockReturnValueOnce('bin')            // Second check
                .mockReturnValueOnce('dist');          // Third check

            // Act
            const result = (frameworkProvider as any).getDistPath();

            // Assert
            expect(result).toBe(mockParentDir2);
            expect(dirnameSpy).toHaveBeenCalledTimes(3);
            expect(basenameSpy).toHaveBeenCalledTimes(3);
        });

        test('should throw error when dist directory cannot be found', () => {
            // Arrange
            const mockCurrentDir = '/some/other/path';

            jest.spyOn(path, 'dirname')
                .mockReturnValueOnce(mockCurrentDir)
                .mockImplementation(path => {
                    // Simulate moving up the directory tree but never finding 'dist'
                    if (path === '/') return '/';

                    return path.substring(0, path.lastIndexOf('/'));
                });

            jest.spyOn(path, 'basename').mockReturnValue('not-dist');

            // Act & Assert
            expect(() => (frameworkProvider as any).getDistPath()).toThrow(
                /Could not find 'dist' directory within/
            );
        });

        test('should respect MAX_DEPTH and throw error when exceeding it', () => {
            // Arrange
            const mockCurrentDir = '/level1/level2/level3/level4/level5/level6/level7/level8/level9/level10/level11';

            jest.spyOn(path, 'dirname')
                .mockReturnValueOnce(mockCurrentDir)
                .mockImplementation(path => {
                    // Simulate moving up the directory tree but never finding 'dist'
                    if (path === '/') return '/';

                    return path.substring(0, path.lastIndexOf('/'));
                });

            const basenameSpy = jest.spyOn(path, 'basename').mockReturnValue('not-dist');

            // Act & Assert
            expect(() => (frameworkProvider as any).getDistPath()).toThrow(
                /Could not find 'dist' directory within 10 levels/
            );

            // Should not try more than MAX_DEPTH (10) + initial check (1) times
            expect(basenameSpy).toHaveBeenCalledTimes(11);
        });

        test('should stop searching when reaching root directory', () => {
            // Arrange
            const mockCurrentDir = '/not-dist';
            const dirnameSpy = jest.spyOn(path, 'dirname')
                .mockReturnValueOnce(mockCurrentDir)
                .mockReturnValueOnce('/');  // Root directory

            jest.spyOn(path, 'basename')
                .mockReturnValueOnce('not-dist')
                .mockReturnValueOnce('');

            // Act & Assert
            expect(() => (frameworkProvider as any).getDistPath()).toThrow(
                /Could not find 'dist' directory/
            );

            // Should stop after reaching the root directory
            expect(dirnameSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('pathExists', () => {
        test('should return true when path exists', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const testPath = '/path/exists';

            // Mock fs.accessSync to not throw an error (meaning the path exists)
            jest.spyOn(fs, 'accessSync').mockImplementation(() => {});

            // Act
            const result = frameworkProvider.pathExists(testPath);

            // Assert
            expect(result).toBe(true);
            expect(fs.accessSync).toHaveBeenCalledWith(testPath, constants.F_OK);
        });

        test('should return false when path does not exist', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const testPath = '/path/does-not-exist';

            // Mock fs.accessSync to throw an error (meaning the path doesn't exist)
            jest.spyOn(fs, 'accessSync').mockImplementation(() => {
                throw new Error('ENOENT: no such file or directory');
            });

            // Act
            const result = frameworkProvider.pathExists(testPath);

            // Assert
            expect(result).toBe(false);
            expect(fs.accessSync).toHaveBeenCalledWith(testPath, constants.F_OK);
        });
    });
});
