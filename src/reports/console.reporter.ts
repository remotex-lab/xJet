/**
 * Type imports (removed at compile time)
 */
import type {
    LogMessageInterface,
    ErrorMessageInterface,
    StatusMessageInterface,
    ActionMessageInterface
} from '@handler/interfaces/message-handler.interface';
import type {
    StateReporterInterface,
    SuiteReporterInterface,
    SuitesReporterInterface
} from '@reports/interfaces/console-reporter.interface';

/**
 * Runtime imports
 */
import { ShadowRenderer } from '@ui/shadow.ui';
import { Icons } from '@ui/constants/icon.constant';
import { AbstractReporter } from './abstract.reporter';
import { Colors, setColor } from '@components/colors.component';
import { SuiteStateType } from '@reports/constants/console-reporter.constants';
import { ActionType, KindType, StatusType } from '@handler/constants/message-handler.constant';

export default class ConsoleReporter extends AbstractReporter {
    private readonly state: StateReporterInterface;
    private readonly shadow = new ShadowRenderer();
    private readonly suiteState: SuitesReporterInterface = {};

    constructor(protected silentLog: boolean = false) {
        super(silentLog);
        this.state = {
            todo: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            totalSuites: 0,
            failedSuites: 0,
            passedSuites: 0,
            skippedSuites: 0
        };
    }

    /**
     * Initialize suites and render initial state
     */
    init(suites: string[]): void {
        this.state.totalSuites = suites.length;

        for (let i = 0; i < suites.length; i++) {
            const suite = suites[i];
            const index = i + 1;

            this.suiteState[suite] = {
                logs: [],
                index,
                running: true,
                state: SuiteStateType.SKIP,
                tests: [],
                errors: []
            };

            this.renderSuiteState(suite, index, Icons.RUNNING);
        }

        this.shadow.renderAll();
    }

    /**
     * Process and format a log message
     */
    log(log: LogMessageInterface): void {
        const space = '  ';
        const context = log.context ? setColor(Colors.LightGoldenrodYellow, `[ ${ log.context } ] `) : '';
        const title = setColor(Colors.Gray, `console.${ log.type } {`);
        const source = setColor(Colors.BurntOrange, log.location.source);
        const prefix = setColor(Colors.Gray, `} ${ context }at (`);
        const suffix = setColor(Colors.Gray, `:${ log.location.line }:${ log.location.column })`);

        const formattedLog =
            `${ title }\n${ space }${ log.value.replaceAll('\n', '\n' + space) }\n${ prefix }${ source }${ suffix }\n`;

        this.suiteState[log.suiteName].logs.push(formattedLog);
    }

    /**
     * Process status messages for test execution
     */
    status(status: StatusMessageInterface): void {
        // Skip DESCRIBE kind statuses
        if (status.kindNumber === KindType.DESCRIBE) return;

        switch (status.statusNumber) {
            case StatusType.START:
                this.state.total++;
                break;

            case StatusType.SKIP:
                this.handleSkipStatus(status);
                break;

            case StatusType.TODO:
                this.handleTodoStatus(status);
                break;

            case StatusType.END:
                this.handleEndStatus(status);
                break;
        }
    }

    /**
     * Process action messages
     */
    action(action: ActionMessageInterface): void {
        const suite = this.suiteState[action.suiteName];

        if (action.kindNumber === KindType.DESCRIBE) {
            this.handleDescribeAction(action, suite);

            return this.shadow.renderAll();
        }

        switch (action.actionNumber) {
            case ActionType.SUCCESS:
                this.handleSuccessAction(action);
                break;

            case ActionType.FAILURE:
                this.handleFailureAction(action);
                break;
        }

        return this.shadow.renderAll();
    }

    /**
     * Handle suite-level errors
     */
    suiteError(error: ErrorMessageInterface): void {
        this.state.failedSuites++;
        this.renderSuiteState(error.suiteName, this.suiteState[error.suiteName].index, Icons.FAILED);

        const title = setColor(Colors.BrightPink, error.message);
        const content = `\n\n${ error.formatCode }\n\n${ error.stacks }\n`;
        this.suiteState[error.suiteName].errors.push(`${ Icons.FAILED } ${ title }${ content }`);
        this.shadow.renderAll();
    }

    /**
     * Finish reporting and print final results
     */
    finish(): void {
        this.shadow.dispose();
        this.printTestResults();
        this.printErrorsAndLogs();
    }

    /**
     * Handle SKIP status
     */
    private handleSkipStatus(status: StatusMessageInterface): void {
        this.state.skipped++;
        const title = this.formatTitle(status.ancestry, status.description);
        this.suiteState[status.suiteName].tests.push(`${ Icons.TODO } ${ title }`);
    }

    /**
     * Handle TODO status
     */
    private handleTodoStatus(status: StatusMessageInterface): void {
        this.state.todo++;
        const title = this.formatTitle(status.ancestry, status.description);
        this.suiteState[status.suiteName].tests.push(`${ Icons.SKIPPED } ${ title }`);
    }

    /**
     * Handle END status and update suite counters
     */
    private handleEndStatus(status: StatusMessageInterface): void {
        const suiteName = status.suiteName;
        this.suiteState[suiteName].running = false;

        const state = this.suiteState[suiteName].state;
        switch (state) {
            case SuiteStateType.SKIP:
                this.state.skippedSuites++;
                break;
            case SuiteStateType.FAILURE:
                this.state.failedSuites++;
                break;
            default:
                this.state.passedSuites++;
                break;
        }
    }

    /**
     * Handle DESCRIBE kind actions
     */
    private handleDescribeAction(action: ActionMessageInterface, suite: SuiteReporterInterface): void {
        if (action.actionNumber === ActionType.FAILURE) {
            suite.state = SuiteStateType.FAILURE;
            this.state.failedSuites++;
            this.processActionErrors(action);
        }

        if (action.description === '') {
            this.updateSuiteStateIcon(action.suiteName, suite);
        }
    }

    /**
     * Update suite state icon based on its current state
     */
    private updateSuiteStateIcon(suiteName: string, suite: SuiteReporterInterface): void {
        const icon = (() => {
            switch (suite.state) {
                case SuiteStateType.SKIP:
                    return Icons.SKIPPED;
                case SuiteStateType.FAILURE:
                    return Icons.FAILED;
                case SuiteStateType.SUCCESS:
                    return Icons.PASSED;
                default:
                    return Icons.RUNNING;
            }
        })();

        this.renderSuiteState(suiteName, suite.index, icon);
    }

    /**
     * Handle SUCCESS action
     */
    private handleSuccessAction(action: ActionMessageInterface): void {
        this.state.passed++;
        this.suiteState[action.suiteName].state = SuiteStateType.SUCCESS;
        const title = this.formatTitle(action.ancestry, action.description);
        this.suiteState[action.suiteName].tests.push(`${ Icons.PASSED } ${ title }`);
    }

    /**
     * Handle FAILURE action
     */
    private handleFailureAction(action: ActionMessageInterface): void {
        this.state.failed++;
        this.suiteState[action.suiteName].state = SuiteStateType.FAILURE;

        const title = this.formatTitle(action.ancestry, action.description) + '\n';
        this.suiteState[action.suiteName].tests.push(`${ Icons.FAILED } ${ title }`);

        this.processActionErrors(action);
    }

    /**
     * Process errors from an action
     */
    private processActionErrors(action: ActionMessageInterface): void {
        for (const error of action.errors) {
            const title = this.formatTitle(action.ancestry, action.description) + '\n';
            const content = `${ error.message }\n\n${ error.formatCode }\n\n${ error.stacks }\n`;
            this.suiteState[action.suiteName].errors.push(`${ Icons.FAILED } ${ title }${ content }`);
        }
    }

    /**
     * Print test results for all suites
     */
    private printTestResults(): void {
        for (const [ suite, state ] of Object.entries(this.suiteState)) {
            if (state.tests.length < 1) continue;

            const icon = this.getSuiteStateIcon(state.state);
            console.log(`\n${ icon } ${ setColor(Colors.LightCoral, suite) }`);

            for (const test of state.tests) {
                console.log(test);
            }
        }
    }

    /**
     * Print errors and logs for all suites
     */
    private printErrorsAndLogs(): void {
        for (const [ suite, state ] of Object.entries(this.suiteState)) {
            if (state.errors.length < 1 && state.logs.length < 1) continue;

            console.log(`\n${ setColor(Colors.PastelPink, suite) }`);

            for (const log of state.logs) {
                console.log(`\n${ log }\n`);
            }

            for (const error of state.errors) {
                console.log(`\n${ error }\n`);
            }
        }
    }

    /**
     * Get icon for suite state
     */
    private getSuiteStateIcon(state: SuiteStateType): string {
        switch (state) {
            case SuiteStateType.SKIP:
                return Icons.SKIPPED;
            case SuiteStateType.FAILURE:
                return Icons.FAILED;
            case SuiteStateType.SUCCESS:
                return Icons.PASSED;
            default:
                return '';
        }
    }

    /**
     * Format a title from ancestry and description
     */
    private formatTitle(ancestry: string[], description: string): string {
        return [ ...ancestry, description ].join(' > ');
    }

    /**
     * Render the current suite state
     */
    private renderSuiteState(suite: string, index: number, stateIcon: string): void {
        this.shadow.writeText(index, 0, `${ stateIcon } ${ suite }`);
    }

    /**
     * Render current status
     */
    private renderStatus(): void {
        this.shadow.writeText(5, 0, JSON.stringify(this.state, null, 2));
        this.shadow.renderAll();
    }
}
