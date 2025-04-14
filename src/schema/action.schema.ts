/**
 * Import will remove at compile time
 */

import type {
    SchemaInterface,
    LogSchemaInterface,
    RequiredMessageType,
    ErrorSchemaInterface,
    HeaderSchemaInterface,
    StatusSchemaInterface,
    ActionSchemaInterface,
    SchemaTypeToInterface
} from './interfaces/action-schema.interface';
import type { InvocationLocationInterface } from '@shared/components/interfaces/location-component.interface';

/**
 * Imports
 */

import { Struct } from '@remotex-labs/xstruct';
import { errorToSerializable } from '@components/json.component';
import { SchemaType } from '@schema/constants/action-schema.constants';

/**
 * Array of valid schema types supported by the decoder
 *
 * This constant defines the schema types that can be handled by the decoding process.
 * Used for validation to ensure only recognized schema types are processed.
 *
 * @internal
 * @see SchemaType
 * @see decodeSchema
 *
 * @since 1.0.0
 */

const VALID_SCHEMA_TYPES = [ SchemaType.LOG, SchemaType.ACTION, SchemaType.ERROR, SchemaType.STATUS ] as const;

/**
 * Schema definition for location information
 *
 * @internal
 * @see InvocationLocationInterface
 *
 * @since 1.0.0
 */

const LOCATION_SCHEMA = new Struct<InvocationLocationInterface>({
    line: 'UInt32LE',
    column: 'UInt32LE'
});

/**
 * Schema definition for message headers
 *
 * @see HeaderSchemaInterface
 * @since 1.0.0
 */

export const headerSchema = new Struct<HeaderSchemaInterface>({
    type: 'UInt8',
    suiteId: { type: 'string', size: 14 },
    runnerId: { type: 'string', size: 14 }
});

/**
 * Schema definition for log messages
 *
 * @see LogSchemaInterface
 * @since 1.0.0
 */

export const logSchema = new Struct<LogSchemaInterface>({
    level: 'UInt8',
    context: 'string',
    timestamp: 'string',
    location: LOCATION_SCHEMA,
    description: { type: 'string', lengthType: 'UInt32LE' }
});

/**
 * Schema definition for uncaught exceptions
 *
 * @see ErrorSchemaInterface
 * @since 1.0.0
 */

export const errorSchema = new Struct<ErrorSchemaInterface>({
    error: 'string'
});

/**
 * Schema definition for status messages
 *
 * @see StatusSchemaInterface
 * @since 1.0.0
 */

export const statusSchema = new Struct<StatusSchemaInterface>({
    kind: 'UInt8',
    action: 'UInt8',
    ancestry: 'string',
    description: 'string'
});

/**
 * Schema definition for action messages
 *
 * @see ActionSchemaInterface
 * @since 1.0.0
 */

export const actionSchema = new Struct<ActionSchemaInterface>({
    errors: 'string',
    duration: 'UInt32LE',
    location: LOCATION_SCHEMA
});

/**
 * Encodes schema data into a binary buffer
 *
 * @template T - Type of schema being encoded
 *
 * @param data - The schema data to encode
 * @param type - The schema type identifier
 * @returns Buffer containing the encoded schema
 *
 * @example
 * ```ts
 * // Encode log data
 * const logBuffer = encodeSchema(SchemaType.LOG, {
 *   level: LogLevel.INFO,
 *   description: "Operation completed successfully"
 * });
 *
 * // Encode error data
 * const errorBuffer = encodeSchema(SchemaType.ERROR, {
 *    error: JSON.stringify({ error: serializedError })
 * });
 * ```
 *
 * @see logSchema
 * @see errorSchema
 * @see headerSchema
 * @see statusSchema
 * @see actionSchema
 * @see SchemaTypeToInterface
 *
 * @since 1.0.0
 */

export function encodeSchema<T extends SchemaType>(type: T, data: SchemaTypeToInterface<T>): Buffer {
    const dataBuffer: Array<Buffer> = [];
    dataBuffer.push(headerSchema.toBuffer({
        type,
        suiteId: __XJET.runtime.suiteId ?? '',
        runnerId: __XJET.runtime.runnerId ?? ''
    }));

    switch (type) {
        case SchemaType.LOG:
            dataBuffer.push(logSchema.toBuffer(data as unknown as LogSchemaInterface));
            break;

        case SchemaType.ERROR:
            dataBuffer.push(errorSchema.toBuffer(data as unknown as ErrorSchemaInterface));
            break;

        case SchemaType.STATUS:
            dataBuffer.push(statusSchema.toBuffer(data as unknown as StatusSchemaInterface));
            break;

        case SchemaType.ACTION:
            dataBuffer.push(statusSchema.toBuffer(data as unknown as StatusSchemaInterface));
            dataBuffer.push(actionSchema.toBuffer(data as unknown as ActionSchemaInterface));
            break;
    }

    return Buffer.concat(dataBuffer);
}

/**
 * Decodes a binary buffer into a schema object
 *
 * @template T - Type of the resulting schema object
 *
 * @param buffer - The buffer to decode
 * @returns Decoded schema object with header information
 *
 * @throws Error - When the buffer contains an invalid schema type
 *
 * @example
 * ```ts
 * // Decode a buffer into a specific schema type
 * const logData = decodeSchema<LogSchemaInterface>(buffer);
 *
 * // Or allow the function to determine the type
 * const data = decodeSchema(buffer);
 * if (data.type === SchemaType.LOG) {
 *   console.log(`Log message: ${data.description}`);
 * } else if (data.type === SchemaType.ERROR) {
 *   console.error(`Error occurred: ${data.message}`);
 * }
 * ```
 *
 * @see logSchema
 * @see headerSchema
 * @see actionSchema
 * @see errorSchema
 * @see MessageType
 *
 * @since 1.0.0
 */

export function decodeSchema<T = SchemaInterface>(buffer: Buffer): RequiredMessageType<T> {
    const header = headerSchema.toObject(buffer);
    const data = buffer.subarray(headerSchema.size);

    if (!VALID_SCHEMA_TYPES.includes(header.type))
        throw new Error(`Invalid schema type: ${ header.type }`);

    switch (header.type) {
        case SchemaType.LOG: {
            return {
                ...header,
                ...logSchema.toObject(data)
            } as unknown as RequiredMessageType<T>;
        }

        case SchemaType.ERROR: {
            return {
                ...header,
                ...errorSchema.toObject(data)
            } as unknown as RequiredMessageType<T>;
        }

        case SchemaType.STATUS: {
            return {
                ...header,
                ...statusSchema.toObject(data)
            } as unknown as RequiredMessageType<T>;
        }

        case SchemaType.ACTION: {
            let offset = statusSchema.size;

            return {
                ...header,
                ...statusSchema.toObject(data, (dynamicOffset) => {
                    offset += dynamicOffset;
                }),
                ...actionSchema.toObject(data.subarray(offset))
            } as unknown as RequiredMessageType<T>;
        }
    }

    // should not enter here, this is just for safety
    return header as unknown as RequiredMessageType<T>;
}

/**
 * Encodes an error into a schema buffer with header information
 *
 * @param error - The Error object to encode in the schema
 * @param suiteId - The ID of the suite generating this error
 * @param runnerId - The ID of the runner generating this error
 * @returns Buffer containing the encoded error schema
 *
 * @throws Error - If serialization of the error object fails
 *
 * @example
 * ```ts
 * const errorBuffer = encodeErrorSchema(
 *   new Error("Connection failed"),
 *   "runner-12345"
 * );
 * ```
 *
 * @see errorSchema
 * @see headerSchema
 * @see errorToSerializable
 *
 * @since 1.0.0
 */

export function encodeErrorSchema(error: Error, suiteId: string, runnerId: string): Buffer {
    const header = headerSchema.toBuffer({
        type: SchemaType.ERROR,
        suiteId: suiteId ?? '',
        runnerId: runnerId ?? ''
    });

    const dataBuffer = errorSchema.toBuffer({
        error: JSON.stringify(errorToSerializable(error))
    });

    return Buffer.concat([ header, dataBuffer ]);
}
