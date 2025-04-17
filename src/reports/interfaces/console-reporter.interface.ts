/**
 * Import will remove at compile time
 */

import type { SuiteStateType } from '@reports/constants/console-reporter.constants';

export interface StateReporterInterface {
    todo: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    totalSuites: number;
    failedSuites: number;
    passedSuites: number;
    skippedSuites: number;
}

export interface SuiteReporterInterface {
    logs: Array<string>;
    index: number;
    state: SuiteStateType;
    tests: Array<string>,
    errors: Array<string>,
    running: boolean;
}

export interface SuitesReporterInterface {
    [suiteName: string]: SuiteReporterInterface
}
