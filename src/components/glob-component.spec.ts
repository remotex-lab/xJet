/**
 * Imports
 */

import { compileGlobPattern, isGlob } from '@components/glob.component';

/**
 * Tests
 */

describe('isGlob', () => {
    test('should return true for basic glob patterns', () => {
        expect(isGlob('*.js')).toBe(true);
        expect(isGlob('src/**/*.ts')).toBe(true);
        expect(isGlob('file-?.txt')).toBe(true);
    });

    test('should return true for brace patterns', () => {
        expect(isGlob('{a,b}.js')).toBe(true);
        expect(isGlob('src/{foo,bar}/*.js')).toBe(true);
    });

    test('should return true for character class patterns', () => {
        expect(isGlob('[abc].js')).toBe(true);
        expect(isGlob('src/[0-9]*.ts')).toBe(true);
    });

    test('should return true for extglob patterns', () => {
        expect(isGlob('@(pattern).js')).toBe(true);
        expect(isGlob('+(foo|bar).ts')).toBe(true);
    });

    test('should return false for regular file paths', () => {
        expect(isGlob('file.js')).toBe(false);
        expect(isGlob('src/components/Button.tsx')).toBe(false);
        expect(isGlob('path/to/file.txt')).toBe(false);
        expect(isGlob('C:\\Users\\admin\\GoogleDrive\\Desktop\\main\\src\\test2.spec.ts')).toBe(false);
    });
});

describe('compileGlobPattern', () => {
    test('should correctly match simple wildcards', () => {
        const regex = compileGlobPattern('*.js');
        expect(regex.test('file.js')).toBe(true);
        expect(regex.test('test.js')).toBe(true);
        expect(regex.test('file.ts')).toBe(false);
        expect(regex.test('folder/file.js')).toBe(false);
    });

    test('should handle double asterisk (recursive matching)', () => {
        const regex = compileGlobPattern('src/**/test.js');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/bar/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(false);
    });

    test('should handle question marks', () => {
        const regex = compileGlobPattern('file-?.js');
        expect(regex.test('file-1.js')).toBe(true);
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-ab.js')).toBe(false);
    });

    test('should handle brace expansion', () => {
        const regex = compileGlobPattern('src/{foo,bar}.js');
        expect(regex.test('src/foo.js')).toBe(true);
        expect(regex.test('src/bar.js')).toBe(true);
        expect(regex.test('src/baz.js')).toBe(false);
    });

    test('should handle character classes', () => {
        const regex = compileGlobPattern('file-[abc].js');
        expect(regex.test('file-a.js')).toBe(true);
        expect(regex.test('file-b.js')).toBe(true);
        expect(regex.test('file-c.js')).toBe(true);
        expect(regex.test('file-d.js')).toBe(false);
    });

    test('should handle complex patterns', () => {
        const regex = compileGlobPattern('src/**/{test,spec}.[jt]s');
        expect(regex.test('src/test.js')).toBe(true);
        expect(regex.test('src/test.ts')).toBe(true);
        expect(regex.test('src/foo/test.js')).toBe(true);
        expect(regex.test('src/foo/spec.ts')).toBe(true);
        expect(regex.test('src/foo/file.js')).toBe(false);
    });

    test('should escape special regex characters', () => {
        const regex = compileGlobPattern('file+name.js');
        expect(regex.test('file+name.js')).toBe(true);
        expect(regex.test('filename.js')).toBe(false);
    });

    test('should handle file extensions with dots', () => {
        const regex = compileGlobPattern('*.min.js');
        expect(regex.test('file.min.js')).toBe(true);
        expect(regex.test('file.js')).toBe(false);
    });
});
