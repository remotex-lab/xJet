/**
 * Imports
 */

import { join, normalize } from 'path';
import { readdirSync, statSync } from 'fs';
import { SpecsProvider } from './specs.provider';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Mock dependencies
 */

jest.mock('fs');

/**
 * Tests
 */

describe('matchesPatterns', () => {
    test('should match simple exact patterns', () => {
        const patterns = [ 'file.txt' ];
        expect(SpecsProvider.matchesPatterns('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('other.txt', patterns)).toBe(false);
    });

    test('should match single wildcard patterns', () => {
        const patterns = [ '*.txt' ];
        expect(SpecsProvider.matchesPatterns('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('file.jpg', patterns)).toBe(false);
        expect(SpecsProvider.matchesPatterns('path/file.txt', patterns)).toBe(false);
    });

    test('should match double asterisk patterns for directories', () => {
        const patterns = [ '**/test.txt' ];
        expect(SpecsProvider.matchesPatterns('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test.jpg', patterns)).toBe(false);
    });

    test('should match patterns with middle directory wildcards', () => {
        const patterns = [ 'src/**/test.txt' ];
        expect(SpecsProvider.matchesPatterns('src/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('other/test.txt', patterns)).toBe(false);
    });

    test('should match multiple patterns', () => {
        const patterns = [ '*.txt', '*.md' ];
        expect(SpecsProvider.matchesPatterns('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('readme.md', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('image.png', patterns)).toBe(false);
    });

    test('should match patterns with question marks', () => {
        const patterns = [ 'test.???' ];
        expect(SpecsProvider.matchesPatterns('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test.doc', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test.jpeg', patterns)).toBe(false);
    });

    test('should match patterns with character sets', () => {
        const patterns = [ 'file[0-9].txt' ];
        expect(SpecsProvider.matchesPatterns('file1.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('file5.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('filea.txt', patterns)).toBe(false);
    });

    test('should match patterns with negated character sets', () => {
        const patterns = [ 'file[^0-9].txt' ];
        expect(SpecsProvider.matchesPatterns('filea.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('file1.txt', patterns)).toBe(false);
    });

    test('should match patterns with braces', () => {
        const patterns = [ '*.{jpg,png}' ];
        expect(SpecsProvider.matchesPatterns('image.jpg', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('image.png', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('image.gif', patterns)).toBe(false);
    });

    test('should handle RegExp patterns directly', () => {
        const patterns = [ /^test\d+\.txt$/ ];
        expect(SpecsProvider.matchesPatterns('test123.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test.txt', patterns)).toBe(false);
    });

    test('should match complex nested patterns', () => {
        const patterns = [ 'src/**/test/*.{js,ts}' ];
        expect(SpecsProvider.matchesPatterns('src/test/file.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/deep/test/file.ts', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/test/file.css', patterns)).toBe(false);
        expect(SpecsProvider.matchesPatterns('other/test/file.js', patterns)).toBe(false);
    });

    test('should match patterns with multiple double asterisks', () => {
        const patterns = [ '**/*.test.{js,ts}' ];
        expect(SpecsProvider.matchesPatterns('file.test.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/file.test.ts', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('src/nested/deep/file.test.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('file.js', patterns)).toBe(false);
    });

    test('should handle empty patterns array', () => {
        expect(SpecsProvider.matchesPatterns('file.txt', [])).toBe(false);
    });

    test('should handle mixed string and RegExp patterns', () => {
        const patterns = [ '*.txt', /^test\d+\.js$/ ];
        expect(SpecsProvider.matchesPatterns('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('test123.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesPatterns('other.js', patterns)).toBe(false);
    });
});

describe('SpecsService', () => {
    let spyPath: jest.SpyInstance;
    let mockConfig: any;
    let specsService: SpecsProvider;
    const rootPath = '/test/root';

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        (readdirSync as jest.Mock).mockClear();
        (statSync as jest.Mock).mockClear();

        (readdirSync as jest.Mock).mockReturnValue([]);
        spyPath = jest.spyOn(FrameworkProvider.getInstance(), 'paths', 'get');
        spyPath.mockReturnValue({
            root: rootPath
        });

        mockConfig = {
            files: [ '**/*.spec.ts' ],
            suits: [],
            exclude: [ '**/node_modules/**' ]
        };

        specsService = new SpecsProvider(mockConfig);
    });

    test('should return false when suite is empty', () => {
        mockConfig.suites = [];
        specsService = new SpecsProvider(mockConfig);

        const result = (specsService as any).shouldSkip('test/file.spec.ts');
        expect(result).toBe(false);
    });

    test('should return true when file does not match any suite patterns', () => {
        mockConfig.suites = [ 'src/*.spec.ts' ];
        specsService = new SpecsProvider(mockConfig);

        const result = (specsService as any).shouldSkip('test/file.spec.ts');
        expect(result).toBe(true);
    });

    test('should return false when file matches a suite pattern', () => {
        mockConfig.suites = [ 'test/*.spec.ts' ];
        specsService = new SpecsProvider(mockConfig);

        const result = (specsService as any).shouldSkip('test/file.spec.ts');
        expect(result).toBe(false);
    });

    test('should handle multiple suite patterns correctly', () => {
        mockConfig.suites = [ 'test/*.spec.ts', 'src/*.test.ts' ];
        specsService = new SpecsProvider(mockConfig);

        expect((specsService as any).shouldSkip('test/file.spec.ts')).toBe(false);
        expect((specsService as any).shouldSkip('src/file.test.ts')).toBe(false);
        expect((specsService as any).shouldSkip('other/file.spec.ts')).toBe(true);
    });

    test('should correctly handle paths with root directory', () => {
        mockConfig.suites = [ join(rootPath, 'test/*.spec.ts') ];
        specsService = new SpecsProvider(mockConfig);

        const result = (specsService as any).shouldSkip('test/file.spec.ts');
        expect(result).toBe(false);
    });

    describe('Pattern matching', () => {
        test('should handle question mark patterns', () => {
            mockConfig.files = [ 'test?.spec.ts' ];
            specsService = new SpecsProvider(mockConfig);

            const mockFiles = [ 'test1.spec.ts', 'test.spec.ts', 'testing.spec.ts' ];
            (readdirSync as jest.Mock).mockReturnValueOnce(mockFiles);

            (statSync as jest.Mock).mockImplementation(() => ({
                isDirectory: () => false
            }));

            const result = specsService.getSpecFiles(rootPath);

            expect(Object.keys(result)).toContain('test1.spec.ts');
            expect(Object.keys(result)).not.toContain('testing.spec.ts');
        });

        test('should handle double asterisk patterns', () => {
            mockConfig.files = [ '**/nested/**/*.spec.ts' ];
            specsService = new SpecsProvider(mockConfig);

            // Mock nested directory structure
            (readdirSync as jest.Mock)
                .mockImplementationOnce(() => [ 'nested' ])
                .mockImplementationOnce(() => [ 'deep' ])
                .mockImplementationOnce(() => [ 'test.spec.ts' ]);

            (statSync as jest.Mock).mockImplementation((path) => ({
                isDirectory: () => !path.endsWith('.ts')
            }));

            const result = specsService.getSpecFiles(rootPath);

            expect(Object.keys(result)).toContain(normalize('nested/deep/test.spec.ts'));
        });
    });

    describe('getSpecFiles', () => {
        test('should filter files based on suite configuration', () => {
            // Setup mock filesystem structure
            const mockFiles = [ 'login.spec.ts', 'auth.spec.ts', 'profile.spec.ts' ];
            (readdirSync as jest.Mock).mockReturnValue(mockFiles);

            // Mock all files as regular files, not directories
            (statSync as jest.Mock).mockReturnValue({
                isDirectory: () => false
            });

            specsService = new SpecsProvider(<any> {
                files: [ '*.spec.ts' ],
                suites: [ 'login.spec.ts', 'auth.spec.ts' ],
                exclude: []
            });

            const result = specsService.getSpecFiles(rootPath);

            // Verify only login and auth spec files are included
            expect(Object.keys(result)).toHaveLength(2);
            expect(Object.keys(result).some(path => path.includes('login'))).toBe(true);
            expect(Object.keys(result).some(path => path.includes('auth'))).toBe(true);
            expect(Object.keys(result).some(path => path.includes('profile'))).toBe(false);
        });

        test('should include all spec files when no suite is configured', () => {
            const mockFiles = [ 'login.spec.ts', 'auth.spec.ts', 'profile.spec.ts' ];
            (readdirSync as jest.Mock).mockReturnValue(mockFiles);
            (statSync as jest.Mock).mockReturnValue({
                isDirectory: () => false
            });

            specsService = new SpecsProvider(<any> {
                files: [ '*.spec.ts' ],
                exclude: []
            });

            const result = specsService.getSpecFiles('/test/dir');

            // Verify all spec files are included
            expect(Object.keys(result)).toHaveLength(3);
            expect(Object.keys(result).some(path => path.includes('login'))).toBe(true);
            expect(Object.keys(result).some(path => path.includes('auth'))).toBe(true);
            expect(Object.keys(result).some(path => path.includes('profile'))).toBe(true);
        });

        test('should handle nested directories with suite filtering', () => {
            // Mock directory structure
            (readdirSync as jest.Mock)
                .mockReturnValueOnce([ 'login', 'auth', 'profile' ]) // First level
                .mockReturnValueOnce([ 'login.spec.ts' ]) // login directory
                .mockReturnValueOnce([ 'auth.spec.ts' ]) // auth directory
                .mockReturnValueOnce([ 'profile.spec.ts' ]); // profile directory

            // Mock directory/file checks
            (statSync as jest.Mock).mockImplementation((path: string) => ({
                isDirectory: () => path.endsWith('login') || path.endsWith('auth') || path.endsWith('profile')
            }));

            specsService = new SpecsProvider(<any> {
                files: [ '**/*.spec.ts' ],
                suites: [ 'login/login.spec.ts', 'auth/auth.spec.ts' ],
                exclude: []
            });

            const specs = specsService.getSpecFiles(rootPath);

            // Verify only files from login and auth directories are included
            expect(Object.keys(specs)).toHaveLength(2);
            expect(Object.keys(specs).some(path => path.includes('login'))).toBe(true);
            expect(Object.keys(specs).some(path => path.includes('auth'))).toBe(true);
            expect(Object.keys(specs).some(path => path.includes('profile'))).toBe(false);
        });

        test('should handle empty suite array', () => {
            const mockFiles = [ 'login.spec.ts', 'auth.spec.ts', 'profile.spec.ts' ];
            (readdirSync as jest.Mock).mockReturnValue(mockFiles);
            (statSync as jest.Mock).mockReturnValue({
                isDirectory: () => false
            });

            specsService = new SpecsProvider(<any> {
                files: [ '*.spec.ts' ],
                suite: [],
                exclude: []
            });

            const result = specsService.getSpecFiles('/test/dir');

            // Verify all spec files are included when the suite is empty
            expect(Object.keys(result)).toHaveLength(3);
        });

        test('should return matching spec files', () => {
            // Mock file system
            const mockFiles = [ 'test.spec.ts', 'other.ts', 'nested' ];
            // For nested directory
            (readdirSync as jest.Mock)
                .mockImplementationOnce(() => mockFiles)  // First call for root
                .mockImplementationOnce(() => [ 'nested.spec.ts' ]); // Second call for nested dir

            // Mock stat results
            (statSync as jest.Mock).mockImplementation((path) => ({
                isDirectory: () => path.endsWith('nested')
            }));

            const result = specsService.getSpecFiles(rootPath);

            expect(result).toEqual({
                'test.spec.ts': normalize(`${ rootPath }/test.spec.ts`),
                [ normalize('nested/nested.spec.ts') ]: normalize(`${ rootPath }/nested/nested.spec.ts`)
            });
        });

        test('should exclude files matching exclude patterns', () => {
            // Mock file system
            const mockFiles = [ 'test.spec.ts', 'node_modules' ];
            (readdirSync as jest.Mock).mockReturnValueOnce(mockFiles);

            (statSync as jest.Mock).mockImplementation((path) => ({
                isDirectory: () => path.includes('node_modules')
            }));

            const result = specsService.getSpecFiles(rootPath);

            expect(result).toEqual({
                'test.spec.ts': normalize(`${ rootPath }/test.spec.ts`)
            });
            expect(Object.keys(result)).not.toContain('node_modules');
        });

        test('should handle empty directories', () => {
            (readdirSync as jest.Mock).mockReturnValue([]);

            const result = specsService.getSpecFiles('/test/dir');

            expect(result).toEqual({});
        });

        test('should handle complex glob patterns', () => {
            mockConfig.files = [ '**/*{spec,test}.ts' ];
            specsService = new SpecsProvider(mockConfig);

            const mockFiles = [ 'component.spec.ts', 'service.test.ts', 'regular.ts' ];
            (readdirSync as jest.Mock).mockReturnValue(mockFiles);

            (statSync as jest.Mock).mockImplementation(() => ({
                isDirectory: () => false
            }));

            const result = specsService.getSpecFiles(rootPath);

            expect(Object.keys(result)).toContain('component.spec.ts');
            expect(Object.keys(result)).toContain('service.test.ts');
            expect(Object.keys(result)).not.toContain('regular.ts');
        });
    });
});
