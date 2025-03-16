export interface  RuntimeConfigInterface {
    seed: number;
    bail: boolean;
    filter: Array<string>;
    timeout: number;
    suiteId: string;
    runnerId: string;
    relativePath: string;
}
