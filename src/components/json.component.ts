
/**
 * Transforms an Error object into a serializable plain object representation
 *
 * @param error - The Error object to transform into a serializable format
 * @returns A plain object containing all enumerable properties of the Error plus standard Error properties
 *
 * @throws TypeError - When the input is not an Error instance
 *
 * @remarks
 * This function preserves all enumerable properties from the Error object while
 * also explicitly including the standard Error properties (name, message, stack)
 * which might be non-enumerable in some JavaScript environments.
 *
 * @example
 * ```ts
 * const error = new Error("Something went wrong");
 * error.code = 500;
 *
 * const serialized = errorToSerializable(error);
 * // Result: { code: 500, name: "Error", message: "Something went wrong", stack: "..." }
 * ```
 *
 * @see errorReplacer
 * @see formatValue
 *
 * @since 1.0.0
 */

export function errorToSerializable(error: Error): Record<string, unknown> {
    return {
        ...error,
        name: error.name,
        stack: error.stack,
        message: error.message
    };
}

/**
 * Transforms Error objects into serializable plain objects when stringifying with JSON
 *
 * @param key - The key of the value being processed by JSON.stringify
 * @param value - The value being processed by JSON.stringify
 * @returns A serializable representation of the value, with special handling for Error objects
 *
 * @throws TypeError - When encountering circular references that can't be serialized
 *
 * @remarks
 * This function is designed to be used as a replacer function for JSON.stringify.
 * It preserves all properties of Error objects by converting them to plain objects
 * while maintaining their original properties.
 *
 * @example
 * ```ts
 * const error = new Error("Something went wrong");
 * error.code = 500;
 *
 * const json = JSON.stringify({ error }, errorReplacer);
 * // Result includes all properties: { "error": { "code": 500, "name": "Error", "message": "Something went wrong", "stack": "..." } }
 * ```
 *
 * @see errorToSerializable
 * @see JSON.stringify
 *
 * @since 1.0.0
 */

export function errorReplacer(key: string, value: unknown): unknown {
    return Object.prototype.toString.call(value) === '[object Error]' ? errorToSerializable(<Error> value) : value;
}

/**
 * Converts any JavaScript value to a string representation with special handling for various types
 *
 * @param value - The value to be formatted into a string
 * @returns A string representation of the provided value
 *
 * @throws Error - When the serialization encounters unexpected errors
 *
 * @remarks
 * This function handles primitives, objects, errors, and objects with custom toJSON methods.
 * It uses special handling for Error objects to ensure all error properties are preserved.
 * For objects, the output is a formatted JSON string with 2-space indentation.
 * When circular references are detected, the function returns an empty object representation.
 *
 * @example
 * ```ts
 * // Primitive values
 * formatValue(42); // Returns "42"
 * formatValue(null); // Returns "null"
 *
 * // Error objects
 * const error = new Error("Something went wrong");
 * formatValue(error); // Returns formatted JSON with name, message, stack
 *
 * // Regular objects
 * formatValue({ a: 1, b: "test" }); // Returns nicely formatted JSON
 * ```
 *
 * @see errorToSerializable
 * @see errorReplacer
 *
 * @since 1.0.0
 */

export function formatValue(value: unknown): string {
    // Handle primitives
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value !== 'object' && typeof value !== 'function') return String(value);

    try {
        // Error object handling
        if (value instanceof Error) {
            return JSON.stringify(errorToSerializable(value), null, 2);
        }

        // Handle objects with custom toJSON method
        const objJson = value as { toJSON?: () => unknown };
        if (typeof objJson.toJSON === 'function') {
            return JSON.stringify(objJson.toJSON(), errorReplacer, 2);
        }

        // Handle objects with custom inspect method
        const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
        if(customInspectSymbol in value) {
            return (value as Record<symbol, () => string>)[customInspectSymbol]();
        }

        // Standard serialization
        return JSON.stringify(value, errorReplacer, 2);
    } catch {
        return '{}'; // Fallback for circular references
    }
}
