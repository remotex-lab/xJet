/**
 * Imports
 */

import * as fs from 'fs';
import * as path from 'path';
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
    let frameworkProvider: FrameworkProvider;

    // Mock values
    const mockRootPath = '/mock/root';
    const mockDistPath = '/mock/dist/path';
    const mockFrameworkPath = '/mock/framework';
    const mockSourceMapData = 'mock-source-map-data';
    const mockSourceMapPath = '/mock/dist/path/index.js.map';

    beforeEach(() => {
        jest.clearAllMocks();

        (<any> FrameworkProvider).instance = undefined;

        const spyCwd = jest.spyOn(process, 'cwd');
        spyCwd.mockReturnValue(mockRootPath);

        const spyDirname = jest.spyOn(path, 'dirname');
        spyDirname.mockReturnValueOnce(mockDistPath);
        spyDirname.mockReturnValue(mockFrameworkPath);

        const spyReadFileSync = jest.spyOn(fs, 'readFileSync');
        spyReadFileSync.mockReturnValue(Buffer.from(mockSourceMapData));

        (<any> path.join).mockReturnValue(mockSourceMapPath);
        (SourceService as jest.Mock).mockImplementation(() => ({
            file: mockSourceMapPath
        }));

        frameworkProvider = FrameworkProvider.getInstance();
    });

    describe('getInstance', () => {
        test('should return the same instance when called multiple times', () => {
            const instance1 = FrameworkProvider.getInstance();
            const instance2 = FrameworkProvider.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('paths', () => {
        test('should return framework paths', () => {
            expect(frameworkProvider.paths).toEqual({
                root: mockRootPath,
                dist: mockDistPath,
                framework: mockFrameworkPath
            });
        });
    });

    describe('sourceMap', () => {
        test('should initialize source service on first access', () => {
            const sourceMap = frameworkProvider.sourceMap;

            expect(fs.readFileSync).toHaveBeenCalledWith(mockSourceMapPath);
            expect(SourceService).toHaveBeenCalledWith(
                mockSourceMapData,
                expect.any(String)
            );
            expect(sourceMap).toBeDefined();
        });

        test('should reuse existing source service on subsequent accesses', () => {
            const sourceMap1 = frameworkProvider.sourceMap;
            const sourceMap2 = frameworkProvider.sourceMap;

            expect(SourceService).toHaveBeenCalledTimes(1);
            expect(sourceMap1).toBe(sourceMap2);
        });

        test('should throw error when source map initialization fails', () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('File read error');
            });

            expect(() => frameworkProvider.sourceMap)
                .toThrow('Failed to initialize SourceService: File read error');
        });
    });

    describe('isFrameworkSourceFile', () => {
        test('should return true for framework source file', () => {
            const result = frameworkProvider.isFrameworkSourceFile(mockSourceMapPath);
            expect(result).toBe(true);
        });

        test('should return false for non-framework source file', () => {
            const result = frameworkProvider.isFrameworkSourceFile('/some/other/path');
            expect(result).toBe(false);
        });
    });

    describe('getRootDirectory', () => {
        test('should return framework path for framework source file', () => {
            const result = frameworkProvider.getRootDirectory(mockSourceMapPath);
            expect(result).toBe(mockFrameworkPath);
        });

        test('should return root path for non-framework source file', () => {
            const result = frameworkProvider.getRootDirectory('/some/other/path');
            expect(result).toBe(mockRootPath);
        });
    });
});
