/**
 * Imports
 */

import { cwd } from 'process';
import { join, normalize } from 'path';
import { SpecsProvider } from './specs.provider';
import { existsSync, readdirSync, statSync } from 'fs';
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
        const patterns = SpecsProvider.compilePatterns([ 'file.txt' ]);
        expect(SpecsProvider.matchesAnyRegex(join(cwd(), 'file.txt'), patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('other.txt', patterns)).toBe(false);
    });

    test('should match single wildcard patterns', () => {
        const patterns = SpecsProvider.compilePatterns([ '*.txt' ]);
        expect(SpecsProvider.matchesAnyRegex('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('file.jpg', patterns)).toBe(false);
        expect(SpecsProvider.matchesAnyRegex('path/file.txt', patterns)).toBe(false);
    });

    test('should match double asterisk patterns for directories', () => {
        const patterns = SpecsProvider.compilePatterns([ '**/test.txt' ]);
        expect(SpecsProvider.matchesAnyRegex('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test.jpg', patterns)).toBe(false);
    });

    test('should match patterns with middle directory wildcards', () => {
        const patterns = SpecsProvider.compilePatterns([ 'src/**/test.txt' ]);
        expect(SpecsProvider.matchesAnyRegex('src/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/dir/sub-dir/test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('other/test.txt', patterns)).toBe(false);
    });

    test('should match multiple patterns', () => {
        const patterns = SpecsProvider.compilePatterns([ '*.txt', '*.md' ]);
        expect(SpecsProvider.matchesAnyRegex('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('readme.md', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('image.png', patterns)).toBe(false);
    });

    test('should match patterns with question marks', () => {
        const patterns = SpecsProvider.compilePatterns([ 'test.???' ]);
        expect(SpecsProvider.matchesAnyRegex('test.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test.doc', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test.jpeg', patterns)).toBe(false);
    });

    test('should match patterns with character sets', () => {
        const patterns = SpecsProvider.compilePatterns([ 'file[0-9].txt' ]);
        expect(SpecsProvider.matchesAnyRegex('file1.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('file5.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('filea.txt', patterns)).toBe(false);
    });

    test('should match patterns with negated character sets', () => {
        const patterns = SpecsProvider.compilePatterns([ 'file[^0-9].txt' ]);
        expect(SpecsProvider.matchesAnyRegex('filea.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('file1.txt', patterns)).toBe(false);
    });

    test('should match patterns with braces', () => {
        const patterns = SpecsProvider.compilePatterns([ '*.{jpg,png}' ]);
        expect(SpecsProvider.matchesAnyRegex('image.jpg', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('image.png', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('image.gif', patterns)).toBe(false);
    });

    test('should handle RegExp patterns directly', () => {
        const patterns = SpecsProvider.compilePatterns([ /^test\d+\.txt$/ ]);
        expect(SpecsProvider.matchesAnyRegex('test123.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test.txt', patterns)).toBe(false);
    });

    test('should match complex nested patterns', () => {
        const patterns = SpecsProvider.compilePatterns([ 'src/**/test/*.{js,ts}' ]);
        expect(SpecsProvider.matchesAnyRegex('src/test/file.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/deep/test/file.ts', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/test/file.css', patterns)).toBe(false);
        expect(SpecsProvider.matchesAnyRegex('other/test/file.js', patterns)).toBe(false);
    });

    test('should match patterns with multiple double asterisks', () => {
        const patterns = SpecsProvider.compilePatterns([ '**/*.test.{js,ts}' ]);
        expect(SpecsProvider.matchesAnyRegex('file.test.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/file.test.ts', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('src/nested/deep/file.test.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('file.js', patterns)).toBe(false);
    });

    test('should handle empty patterns array', () => {
        expect(SpecsProvider.matchesAnyRegex('file.txt', [])).toBe(false);
    });

    test('should handle mixed string and RegExp patterns', () => {
        const patterns = SpecsProvider.compilePatterns([ '*.txt', /^test\d+\.js$/ ]);
        expect(SpecsProvider.matchesAnyRegex('file.txt', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('test123.js', patterns)).toBe(true);
        expect(SpecsProvider.matchesAnyRegex('other.js', patterns)).toBe(false);
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
        (existsSync as jest.Mock).mockReturnValue(true);

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

    describe('Pattern matching', () => {
        test('should handle question mark patterns', () => {
            mockConfig.files = [ '**test?.spec.ts' ];
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
        beforeEach(() => {

        });

        test('should filter files based on suite configuration', () => {
            // Setup mock filesystem structure
            const mockFiles = [ 'login.spec.ts', 'auth.spec.ts', 'profile.spec.ts' ];
            (readdirSync as jest.Mock).mockReturnValue(mockFiles);

            // Mock all files as regular files, not directories
            (statSync as jest.Mock).mockReturnValue({
                isDirectory: () => false
            });

            specsService = new SpecsProvider(<any>{
                files: [ '*.spec.ts' ],
                suites: [ 'login.spec.ts', 'auth.spec.ts' ],
                exclude: []
            });

            const result = specsService.getSpecFiles(cwd());

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

            specsService = new SpecsProvider(<any>{
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

            specsService = new SpecsProvider(<any>{
                files: [ '**/*.spec.ts' ],
                suites: [ 'login/login.spec.ts', 'auth/auth.spec.ts' ],
                exclude: []
            });

            const specs = specsService.getSpecFiles(cwd());

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

            specsService = new SpecsProvider(<any>{
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
                [normalize('nested/nested.spec.ts')]: normalize(`${ rootPath }/nested/nested.spec.ts`)
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
