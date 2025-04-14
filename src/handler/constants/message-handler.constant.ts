/**
 * Defines the types of test structures in the test framework
 * @since 1.0.0
 */

export enum KindType {
    /**
     * Represents test message
     * @since 1.0.0
     */

    TEST,

    /**
     * Represents suite message
     * @since 1.0.0
     */

    SUITE,

    /**
     * Represents describe message
     * @since 1.0.0
     */

    DESCRIBE
}

/**
 * Defines the status types for test execution flow control
 * @since 1.0.0
 */

export enum StatusType {
    /**
     * Indicates that a test or suite has completed execution
     * @since 1.0.0
     */

    END,

    /**
     * Indicates that a test or describe skipped from execution
     * @since 1.0.0
     */

    SKIP,

    /**
     * Indicates that a test or describe planned for future implementation
     * and skipped from execution
     * @since 1.0.0
     */

    TODO,

    /**
     * Indicates that a test or describe is beginning execution
     * @since 1.0.0
     */

    START,
}

/**
 * Defines the result types for test or describe execution
 * @since 1.0.0
 */

export enum ActionType {
    /**
     * Indicates that a test or describe has failed
     * @since 1.0.0
     */

    FAILURE,

    /**
     * Indicates that a test or suite has completed successfully
     * @since 1.0.0
     */

    SUCCESS
}
