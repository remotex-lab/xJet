/**
 * Imports
 */

import { cwd } from 'process';
import { build, type BuildOptions } from 'esbuild';
import { defaultBuildOptions, transpileFile } from '@services/transpiler.service';

/**
 * Mock dependencies
 */

jest.mock('esbuild');
jest.mock('process', () => ({
    cwd: jest.fn()
}));

/**
 * Tests
 */

describe('transpileFile', () => {
    const mockBuild = build as jest.MockedFunction<typeof build>;
    const mockCwd = cwd as jest.MockedFunction<typeof cwd>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCwd.mockReturnValue('/mock/working/dir');
    });

    test('should transpile a file with default options', async () => {
        // Mock the build result
        const mockOutputFiles = [
            { text: '{"version": 3, "sources": []}' }, // sourceMap
            { text: 'console.log("transpiled");' }     // fileContent
        ];

        mockBuild.mockResolvedValue({
            outputFiles: mockOutputFiles,
            metafile: {}
        } as any);

        const filePath = 'test.ts';
        const result = await transpileFile(filePath);

        // Verify build was called with correct options
        expect(mockBuild).toHaveBeenCalledWith({
            absWorkingDir: '/mock/working/dir',
            ...defaultBuildOptions,
            metafile: true,
            entryPoints: [ filePath ]
        });

        // Verify the returned result
        expect(result).toEqual({
            sourceMap: '{"version": 3, "sources": []}',
            code: 'console.log("transpiled");'
        });
    });

    test('should merge custom build options correctly', async () => {
        // Mock the build result
        const mockOutputFiles = [
            { text: '{"version": 3, "sources": []}' },
            { text: 'console.log("custom");' }
        ];

        mockBuild.mockResolvedValue({
            outputFiles: mockOutputFiles,
            metafile: {}
        } as any);

        const filePath = 'test.ts';
        const customOptions: BuildOptions = {
            minify: true,
            format: 'esm'
        };

        const result = await transpileFile(filePath, customOptions);

        // Verify build was called with merged options
        expect(mockBuild).toHaveBeenCalledWith({
            absWorkingDir: '/mock/working/dir',
            ...defaultBuildOptions,
            ...customOptions,
            metafile: true,
            entryPoints: [ filePath ]
        });

        // Verify the returned result
        expect(result).toEqual({
            sourceMap: '{"version": 3, "sources": []}',
            code: 'console.log("custom");'
        });
    });

    test('should throw an error when build fails', async () => {
        const error = new Error('Build failed');
        mockBuild.mockRejectedValue(error);

        const filePath = 'test.ts';
        await expect(transpileFile(filePath)).rejects.toThrow('Build failed');
    });
});
