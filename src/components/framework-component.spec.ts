/**
 * Imports
 */

import * as fs from 'fs';
import * as path from 'path';
import { SourceService } from '@remotex-labs/xmap';
import { FrameworkComponent } from '@components/framework.component';

/**
 * Mock dependencies
 */

jest.mock('fs');
jest.mock('path');
jest.mock('@remotex-labs/xmap');

/**
 * Tests
 */

describe('FrameworkComponent', () => {
    let frameworkComponent: FrameworkComponent;

    // Mock values
    const mockRootPath = '/mock/root';
    const mockDistPath = '/mock/dist/path';
    const mockFrameworkPath = '/mock/framework';
    const mockSourceMapData = 'mock-source-map-data';
    const mockSourceMapPath = '/mock/dist/path/index.js.map';

    beforeEach(() => {
        jest.clearAllMocks();

        (<any> FrameworkComponent).instance = undefined;

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

        frameworkComponent = FrameworkComponent.getInstance();
    });

    describe('getInstance', () => {
        test('should return the same instance when called multiple times', () => {
            const instance1 = FrameworkComponent.getInstance();
            const instance2 = FrameworkComponent.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('paths', () => {
        test('should return framework paths', () => {
            expect(frameworkComponent.paths).toEqual({
                root: mockRootPath,
                dist: mockDistPath,
                framework: mockFrameworkPath
            });
        });
    });

    describe('sourceMap', () => {
        test('should initialize source service on first access', () => {
            const sourceMap = frameworkComponent.sourceMap;

            expect(fs.readFileSync).toHaveBeenCalledWith(mockSourceMapPath);
            expect(SourceService).toHaveBeenCalledWith(
                mockSourceMapData,
                expect.any(String)
            );
            expect(sourceMap).toBeDefined();
        });

        test('should reuse existing source service on subsequent accesses', () => {
            const sourceMap1 = frameworkComponent.sourceMap;
            const sourceMap2 = frameworkComponent.sourceMap;

            expect(SourceService).toHaveBeenCalledTimes(1);
            expect(sourceMap1).toBe(sourceMap2);
        });

        test('should throw error when source map initialization fails', () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('File read error');
            });

            expect(() => frameworkComponent.sourceMap)
                .toThrow('Failed to initialize SourceService: File read error');
        });
    });


    describe('isFrameworkSourceFile', () => {
        test('should return true for framework source file', () => {
            const result = frameworkComponent.isFrameworkSourceFile(mockSourceMapPath);
            expect(result).toBe(true);
        });

        test('should return false for non-framework source file', () => {
            const result = frameworkComponent.isFrameworkSourceFile('/some/other/path');
            expect(result).toBe(false);
        });
    });

    describe('getRootDirectory', () => {
        test('should return framework path for framework source file', () => {
            const result = frameworkComponent.getRootDirectory(mockSourceMapPath);
            expect(result).toBe(mockFrameworkPath);
        });

        test('should return root path for non-framework source file', () => {
            const result = frameworkComponent.getRootDirectory('/some/other/path');
            expect(result).toBe(mockRootPath);
        });
    });
});
