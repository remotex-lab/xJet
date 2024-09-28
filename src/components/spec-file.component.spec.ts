/**
 * Imports
 */

import { globToRegex } from '@components/spec-file.component';

describe('globToRegex', () => {
    test('converts simple glob patterns', () => {
        expect(globToRegex('*.ts').test('example.ts')).toBe(true);
        expect(globToRegex('*.ts').test('example.js')).toBe(false);
    });

    test('converts double asterisks to match directories', () => {
        expect(globToRegex('**/*.spec.ts').test('src/tests/example.spec.ts')).toBe(true);
        expect(globToRegex('**/*.spec.ts').test('example.spec.ts')).toBe(false);
        expect(globToRegex('**/*.spec.ts').test('src/example.spec.js')).toBe(false);
    });

    test('handles single asterisks correctly', () => {
        expect(globToRegex('src/*.js').test('src/example.js')).toBe(true);
        expect(globToRegex('src/*.js').test('src/nested/example.js')).toBe(false);
        expect(globToRegex('src/*.js').test('example.js')).toBe(false);
    });

    test('converts question marks to match single characters', () => {
        expect(globToRegex('file?.txt').test('file1.txt')).toBe(true);
        expect(globToRegex('file?.txt').test('file.txt')).toBe(false);
    });

    test('converts braces for multiple options', () => {
        expect(globToRegex('file{1,2}.txt').test('file1.txt')).toBe(true);
        expect(globToRegex('file{1,2}.txt').test('file2.txt')).toBe(true);
        expect(globToRegex('file{1,2}.txt').test('file3.txt')).toBe(false);
    });

    test('handles complex patterns', () => {
        expect(globToRegex('src/**/*.spec.ts').test('src/core/utils/example.spec.ts')).toBe(true);
        expect(globToRegex('src/**/*.spec.ts').test('src/core/utils/example.test.ts')).toBe(false);
    });

    test('returns false for non-matching patterns', () => {
        expect(globToRegex('*.spec.ts').test('example.test.ts')).toBe(false);
        expect(globToRegex('src/*.js').test('src/example.ts')).toBe(false);
    });
});
