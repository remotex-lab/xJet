/**
 * Constants
 */

const QUESTION_MARK = /\?/g;
const BRACE_PATTERN = /\{([^}]+)\}/g;
const DOUBLE_ASTERISK = /(?:\/|^)\*{2}(?:\/|$)/g;
const SINGLE_ASTERISK = /\*/g;
const CHARACTER_CLASS = /\\\[([^\]]+)\\\]/g;
const REGEX_SPECIAL_CHARS = /[.+$|[\]\\]/g;

/**
 * Compiles a given glob pattern into a regular expression.
 *
 * @param globPattern - The glob pattern to be converted into a regular expression.
 * @return A regular expression derived from the provided glob pattern.
 *
 * @remarks This method processes a glob pattern by escaping special regex characters
 * and translating glob syntax such as wildcards (*, ?, **) and braces into equivalent
 * regex components.
 *
 * @since 1.0.0
 */

export function compileGlobPattern(globPattern: string): RegExp {
    const escapeRegexChars = (pattern: string): string =>
        pattern.replace(REGEX_SPECIAL_CHARS, '\\$&');

    const convertGlobToRegex = (pattern: string): string => {
        return pattern
            .replace(CHARACTER_CLASS, (_, chars) => `[${ chars }]`)
            .replace(DOUBLE_ASTERISK, '.*')
            .replace(SINGLE_ASTERISK, (match, offset, fullString) =>
                fullString[offset - 1] === '.' ? '*' : '[^\/]*')
            .replace(QUESTION_MARK, '.')
            .replace(BRACE_PATTERN, (_, choices) =>
                `(${ choices.split(',').join('|') })`);
    };

    return new RegExp(`^${ convertGlobToRegex(escapeRegexChars(globPattern)) }$`);
}

/**
 * Determines whether a given string is a glob pattern.
 *
 * A glob pattern typically contains special characters or patterns used for
 * file matching, such as `*`, `?`, `[ ]`, `{ }`, `!`, `@`, `+`, `( )`, and `|`.
 * It also checks for brace expressions like `{a,b}` and extglob patterns like `@(pattern)`.
 *
 * @param str - The string to be evaluated.
 * @returns `true` if the input string is a glob pattern, otherwise `false`.
 *
 * @remarks This function checks for common globbing patterns and may not cover all edge cases.
 *
 * @since 1.0.0
 */

export function isGlob(str: string): boolean {
    // Checks for common glob patterns including:
    // * ? [ ] { } ! @ + ( ) |
    const globCharacters = /[*?[\]{}!@+()|\]]/.test(str);

    // Check for brace expressions like {a,b}
    const hasBraces = /{[^}]+}/.test(str);

    // Check for extglob patterns like @(pattern)
    const hasExtglob = /@\([^)]+\)/.test(str);

    return globCharacters || hasBraces || hasExtglob;
}
