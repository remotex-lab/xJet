/**
 * Represents a base error class that extends the built-in JavaScript `Error` object.
 * This serves as the foundation for more specific error types
 * and helps maintain consistent error handling within the application.
 *
 * @param message - A descriptive message explaining the nature of the error.
 *
 * @remarks
 * The `BaseError` ensures a proper stack trace is captured for debugging purposes.
 * It also standardizes the error name to `'xJetError'`.
 *
 * @since 1.0.0
 */

export class BaseError extends Error {

    /**
     * Constructs a new instance of the xJetError class which extends the base Error class.
     *
     * @param message - The error message to associate with this error instance.
     *
     * @remarks This constructor sets the name of the error to 'xJetError' and ensures the stack
     * trace is properly captured if the environment supports it.
     *
     * @since 1.0.0
     */

    constructor(message: string) {
        super(message);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseError);
        }

        // Assign the name of the error
        this.name = 'xJetError';
    }

    /**
     * Converts the instance of the class into a JSON-compatible object.
     *
     * @returns A key-value pair object representing all properties of the instance.
     *
     * @remarks
     * This method retrieves all property names, including those inherited from the prototype,
     * and creates an object representation of the class instance.
     *
     * @since 1.0.0
     */

    toJSON(): Record<string, unknown> {
        const errorObject: Record<string, unknown> = {};

        // Get all property names, including inherited ones
        const propertyNames = Object.getOwnPropertyNames(this);

        // Add all properties to the error object
        propertyNames.forEach(key => {
            errorObject[key] = this[key as keyof this];
        });

        return errorObject;
    }
}
