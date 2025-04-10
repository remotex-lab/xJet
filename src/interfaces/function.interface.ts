/**
 * A utility type that recursively makes all properties of a given type `T` optional.
 * If a property of `T` is itself an object, this type will also apply the `PartialDeep` transformation to the nested object.
 *
 * @template T - The type for which all properties, including nested ones, will be made optional.
 *
 * @remarks
 * This type is particularly useful when working with deeply nested objects where partial updates or optional inputs are necessary.
 * It ensures that deeply nested properties can be omitted while still conforming to the expected type structure.
 *
 * @since 1.0.0
 */

export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Represents a constructor type that can create an instance of a specific class.
 *
 * @remarks
 * This type is generally used for defining and working with class constructors in a type-safe manner.
 * It ensures that the constructor has a specific signature and returns a specific type of instance.
 * Typically useful in contexts such as dependency injection, factory patterns, or type inference for classes.
 *
 * @since 1.0.0
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorType = new (...args: Array<any>) => any;

/**
 * Represents a generic function type that accepts an arbitrary number of arguments and returns any value.
 *
 * @remarks
 * This type can be used to define functions with flexible argument and return types.
 * It is particularly useful in scenarios where the specific number or types of arguments is unknown at design time.
 *
 * @since 1.0.0
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionType = (...args: Array<any>) => any;

/**
 * Represents a function-like type with customizable return type,
 * argument types, and context (`this` binding).
 *
 * @template Return The return type of the function-like type.
 * Defaults to `unknown`.
 * @template Args The tuple representing the types of arguments the function-like type accepts.
 * Default to an empty array `[]`.
 * @template Context The type of the `this` context bound to the function-like type.
 * Defaults to `unknown`.
 *
 * @param this - The context (`this` binding) used when invoking the function-like type.
 * @param args - The arguments passed to the function-like type, where their types are specified by the `Args` template parameter.
 *
 * @remarks
 * This type is useful for representing callable objects, custom function signatures,
 * or situations where precise control over arguments, return values, or `this` context is needed.
 *
 * @since 1.0.0
 */

export type FunctionLikeType<Return = unknown, Args extends Array<unknown> = [], Context = unknown> =
    (this: Context, ...args: Args) => Return;

/**
 * A utility type that represents a constructor-like type.
 * This type can be used to define a structure for classes that can be instantiated with the specified arguments `Args`
 * and return an object of type `Return`.
 *
 * @template Return Specifies the type that the constructor will produce upon instantiation.
 * Defaults to `unknown`.
 * @template Args Specifies the types of the arguments that the constructor accepts as a tuple.
 * Default to an empty tuple `[]`.
 *
 * @remarks
 * This type is useful for strictly defining class constructors or other callable structures
 * that conform to the `new (...args: Args) => Return` signature.
 *
 * @since 1.0.0
 */

export type ConstructorLikeType<Return = unknown, Args extends Array<unknown> = []> =
    new(...args: Args) => Return;

/**
 * Represents a type that resolves to the value type of the provided generic type `T` if it is `PromiseLike`.
 * If `T` is `PromiseLike`, it infers the resolved type `U` and assigns `U | T`.
 * If `T` is not `PromiseLike`, the resulting type is `never`.
 *
 * @template T The type to evaluate for `PromiseLike` resolution.
 *
 * @param T - The input type to determine its resolved value type.
 *
 * @remarks This type is particularly useful for extracting both the resolved value of a `PromiseLike`
 * type and the type itself if needed.
 *
 * @since 1.0.0
 */

export type ResolvedValueType<T> = T extends PromiseLike<infer U> ? U | T : never;

/**
 * Represents a conditional type that evaluates to `unknown` if the specified type `T`
 * extends a `PromiseLike` type, otherwise evaluates to `never`.
 *
 * @template T The type to evaluate against the conditional type.
 *
 * @remarks
 * This utility type is useful in scenarios where you need to determine if a given
 * type is promise-like and handle rejected values accordingly.
 *
 * @since 1.0.0
 */

export type RejectedValueType<T> = T extends PromiseLike<unknown> ? unknown : never;

/**
 * Represents a utility type that transforms all properties of a given type `T`
 * into required (non-optional) properties.
 *
 * @template T - The object type from which the required type is derived.
 *
 * @remarks
 * This type alias ensures that all properties within the type `T` are marked as required,
 * removing any optional modifiers and making them compulsory in the resulting type.
 *
 * @since 1.0.0
 */

export type ContextType<T> = Required<T>

/**
 * Represents a function that can reject a Promise with an optional reason
 *
 * @since 1.0.0
 */

export type PromiseRejectType<T = unknown> = (reason?: T) => void;

/**
 * Represents a function that can resolve a Promise with a value or another Promise
 *
 * @template T - The type of the value that will be resolved
 *
 * @since 1.0.0
 */

export type PromiseResolveType<T = unknown> = (value: T | PromiseLike<T>) => void;
