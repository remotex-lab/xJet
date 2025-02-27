/**
 * Represents a type of error that extends the standard `Error` object,
 * including an optional property for additional call stack information.
 *
 * @remarks
 * This type extension is particularly useful when debugging errors
 * where tracking multiple call stacks is necessary.
 *
 * @since 1.0.0
 */

export type ErrorType = Error & { callStacks?: Array<NodeJS.CallSite> };
