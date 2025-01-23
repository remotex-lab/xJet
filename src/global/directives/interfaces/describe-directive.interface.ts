export interface FlagsInterface {
    skip?: boolean;
    only?: boolean;
}

export type DescribeCallbackType<T> = (name: string, fn: (arg: T) => void) => void;
