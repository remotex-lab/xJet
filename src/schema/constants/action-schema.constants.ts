/**
 * Defines the available schema types for encoding and decoding operations
 * @since 1.0.0
 */

export enum SchemaType {
    /**
     * Represents a log entry schema
     * @since 1.0.0
     */

    LOG = 0,

    /**
     * Represents an error schema for handling run exception details
     * @since 1.0.0
     */

    ERROR = 1,

    /**
     * Represents a status schema for tracking execution state
     * @since 1.0.0
     */

    STATUS = 2,

    /**
     * Represents an action response containing test execution result details
     * @since 1.0.0
     */

    ACTION = 3
}
