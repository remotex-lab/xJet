/**
 * A regular expression pattern used to match variable-like strings prefixed with a `$` symbol.
 *
 * @remarks
 * This pattern identifies strings that start with a `$`, followed by one or more alphanumeric characters, underscores, hashes, or periods.
 * It is designed to parse and extract such variable-like patterns from text inputs.
 *
 * @since 1.0.0
 */

const VARIABLE_PATTERN = /\$([#\w.])+/g;

/**
 * Formats a given value into a human-readable string representation. If the input is a string,
 * it is returned as-is. Non-string values are converted to a pretty-printed JSON format.
 *
 * @param value - The value to be formatted. Can be of any type.
 * @return The formatted string representation of the input value. Returns the original string if the input is a string, or a pretty-printed JSON if it is not.
 *
 * @remarks This method ensures that non-string values are converted into a JSON string with indentation for easier readability.
 *
 * @since 1.0.0
 */

export function prettyFormat(value: unknown): string {
    if (typeof value === 'string') return value;

    return JSON.stringify(value, null, 4);
}

/**
 * Retrieves a value from a nested object structure based on a specified path.
 *
 * @param data - The object containing the nested data to traverse.
 * @param path - An array of strings representing the sequence of keys to access the desired value.
 * @returns The value found at the specified path within the object, or `undefined` if the path does not exist.
 *
 * @remarks This function safely traverses the given object structure without throwing errors for missing keys or null/undefined values.
 *
 * @since 1.0.0
 */

export function getValueByPath(data: Record<string, unknown>, path: Array<string>): unknown {
    let current: unknown | Record<string, unknown> = data;

    for (const key of path) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return current;
}

/**
 * Resolves a variable token into its corresponding value from the provided data object.
 *
 * @param token - The variable token to resolve. Tokens starting with `$#` will be replaced by the array index.
 * @param data - The object containing data used for resolving the variable token.
 * @param arrayIndex - The index value to be used if the token represents an array index (`$#`).
 * @return The resolved value as a string. If the variable cannot be resolved, the original token is returned.
 *
 * @remarks This function assumes the use of dot notation in token paths to access nested properties within the `data` object.
 *
 * @since 1.0.0
 */
export function resolveVariable(token: string, data: Record<string, unknown>, arrayIndex: number): string {
    if (token === '$#')
        return String(arrayIndex);

    const propertyPath = token.slice(1).split('.');
    const resolvedValue = getValueByPath(data, propertyPath);

    // todo stringify only the first level
    return resolvedValue !== undefined ? String(resolvedValue) : token;
}

/**
 * Replaces variable placeholders within a template string with corresponding values from a provided data object.
 *
 * @param template - The template string containing variable placeholders.
 * @param data - An object mapping variable names to their respective values.
 * @param arrayIndex - The index to be applied when resolving variables that reference array values.
 * @return The resulting string with all variable placeholders replaced by their resolved values.
 *
 * @throws Error Throws an error if a variable cannot be resolved.
 *
 * @remarks The function uses a regular expression to identify variable placeholders within the template string
 * and replaces them with corresponding values derived from the `data` object.
 *
 * @since 1.0.0
 */

export function interpolateVariables(template: string, data: Record<string, unknown>, arrayIndex: number): string {
    return template.replace(
        VARIABLE_PATTERN, (variableToken) => resolveVariable(variableToken, data, arrayIndex)
    );
}


/**
 * Formats a given `title` string by interpolating it with the provided `params` array
 * based on format specification strings. Supports variable interpolation and specific format specifiers.
 *
 * The method handles both `$variable` style interpolation and `%[specifier]` formatting tokens.
 *
 * @param title - The format string containing variables or tokens to be replaced.
 * @param params - An array of values to interpolate or substitute into the format string.
 * @param index - An optional index used for specific token replacements (e.g., `%#`).
 * @return The formatted string after performing substitutions and formatting.
 *
 * @remarks
 * Supported format specifiers:
 * - `%p`: Pretty prints a value.
 * - `%s`: Converts value to a string.
 * - `%d`: Converts value to a numeric string.
 * - `%i`: Converts value to an integer string (floor of the number).
 * - `%f`: Converts value to a floating-point string.
 * - `%j`: Converts value to its JSON representation.
 * - `%o`: Outputs the object's `toString` representation.
 * - `%#`: Replaced with the provided `index`.
 * - `%%`: Escapes the `%` character.
 *
 * If the `title` contains `$`-style variables, it will interpolate those using the first object in the `params` array.
 * This behavior does not apply if the string also contains `%%`.
 *
 * @since 1.0.0
 */

export function printf(title: string, params: Array<unknown>, index: number): string {
    let paramIndex = 0;
    // Handle $variable style interpolation first
    if (title.includes('$') && !title.includes('%%')) {
        title = interpolateVariables(title, <Record<string, unknown>> params[0], index);
    }

    return title.replace(/%([psdifjo#%])/g, (match, format) => {
        if (format === '%') return '%';
        if (format === '#') return String(index);

        const value = params[paramIndex++];
        switch (format) {
            case 'p':
                return prettyFormat(value);
            case 's':
                return String(value);
            case 'd':
                return Number(value).toString();
            case 'i':
                return Math.floor(Number(value)).toString();
            case 'f':
                return Number(value).toString();
            case 'j':
                return JSON.stringify(value);
            case 'o':
                // todo stringify only the first level
                return Object.prototype.toString.call(value);
            default:
                return match;
        }
    });
}
