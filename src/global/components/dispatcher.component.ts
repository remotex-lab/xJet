// export function dispatcherComponent(data: any) {
//     console.log(data);
// }

import type { DispatcherInterface } from '@global/components/interfaces/dispatcher-component.interface';
import { StatusType } from '@global/components/constants/dispatcher-component.constants';

const msToSecondsRounded = (ms: number, decimals: number = 3): number => {
    return Number((ms / 1000).toFixed(decimals));
};


function makeBold(text: string): string {
    const BOLD_START = '\x1b[1m';
    const BOLD_END = '\x1b[0m';

    return `${ BOLD_START }${ text }${ BOLD_END }`;
}

function makeGreen(text: string): string {
    const GREEN_START = '\x1b[32m';
    const COLOR_END = '\x1b[0m';

    return `${ GREEN_START }${ text }${ COLOR_END }`;
}

function makeRed(text: string): string {
    const RED_START = '\x1b[31m';
    const COLOR_END = '\x1b[0m';

    return `${ RED_START }${ text }${ COLOR_END }`;
}

function makeYellow(text: string): string {
    const YELLOW_START = '\x1b[33m';
    const COLOR_END = '\x1b[0m';

    return `${ YELLOW_START }${ text }${ COLOR_END }`;
}

function makeBlue(text: string): string {
    const BLUE_START = '\x1b[34m';
    const COLOR_END = '\x1b[0m';

    return `${ BLUE_START }${ text }${ COLOR_END }`;
}

function makeGray(text: string): string {
    const GRAY_START = '\x1b[90m';  // Using bright black (gray)
    const COLOR_END = '\x1b[0m';

    return `${ GRAY_START }${ text }${ COLOR_END }`;
}


export class TestReporter {
    private startTime: Record<string, number> = {};
    private indent = '  ';
    private failedTests: Array<DispatcherInterface> = [];
    private totalTests = 0;
    private passedTests = 0;
    private skippedTests = 0;
    private todoTests = 0;
    private failedTestsCount = 0;

    dispatch(data: DispatcherInterface): void {
        switch (data.status) {
            case StatusType.START_DESCRIBE:
                this.renderDescribeStart(data);
                break;
            case StatusType.SUCCESS_DESCRIBE:
                this.renderDescribeEnd(data);
                break;
            case StatusType.START_TEST:
                this.handleTestStart(data);
                break;
            case StatusType.SUCCESS_TEST:
                this.handleTestSuccess(data);
                break;
            case StatusType.FAILURE:
                this.handleTestFailure(data);
                break;
            case StatusType.SKIP:
                this.handleTestSkip(data);
                break;
            case StatusType.TODO:
                this.handleTestTodo(data);
                break;
        }
    }

    private renderDescribeStart(data: DispatcherInterface): void {
        const depth = data.parents.length;
        console.log(`${ this.indent.repeat(depth) }${ makeBold(data.description) }`);
    }

    private renderDescribeEnd(data: DispatcherInterface): void {
        // Optional: Add a newline after describe block ends
        console.log();
    }

    private handleTestStart(data: DispatcherInterface): void {
        this.startTime[this.getTestKey(data)] = Date.now();
        this.totalTests++;
    }

    private handleTestSuccess(data: DispatcherInterface): void {
        const duration = this.getTestDuration(data);
        const depth = data.parents.length;
        this.passedTests++;

        console.log(
            `${ this.indent.repeat(depth + 1) }${ makeGreen('✓') } ${ data.description }`,
            makeGray(`(${ msToSecondsRounded(duration) }s)`)
        );
    }

    private handleTestFailure(data: DispatcherInterface): void {
        const duration = this.getTestDuration(data);
        const depth = data.parents.length;
        this.failedTestsCount++;
        this.failedTests.push(data);

        console.log(
            `${ this.indent.repeat(depth + 1) }${ makeRed('✕') } ${ makeRed(data.description) }`,
            makeGray(`(${ msToSecondsRounded(duration) }s)`)
        );
    }

    private handleTestSkip(data: DispatcherInterface): void {
        const depth = data.parents.length;
        this.skippedTests++;

        console.log(
            `${ this.indent.repeat(depth + 1) }${ makeYellow('○') } ${ makeGray(data.description) }`,
            makeYellow('[SKIP]')
        );
    }

    private handleTestTodo(data: DispatcherInterface): void {
        const depth = data.parents.length;
        this.todoTests++;

        console.log(
            `${ this.indent.repeat(depth + 1) }${ makeBlue('☐') } ${ makeGray(data.description) }`,
            makeBlue('[TODO]')
        );
    }

    private getTestKey(data: DispatcherInterface): string {
        return [...data.parents, data.description].join(' › ');
    }

    private getTestDuration(data: DispatcherInterface): number {
        const key = this.getTestKey(data);
        const duration = Date.now() - (this.startTime[key] || Date.now());
        delete this.startTime[key];

        return duration;
    }

    printSummary(): void {
        console.log('\n' + '─'.repeat(80) + '\n');

        const summaryParts = [];
        const total = makeBold(`${ this.totalTests } tests`);

        if (this.passedTests > 0) {
            summaryParts.push(makeGreen(`${ this.passedTests } passed`));
        }
        if (this.failedTestsCount > 0) {
            summaryParts.push(makeRed(`${ this.failedTestsCount } failed`));
        }
        if (this.skippedTests > 0) {
            summaryParts.push(makeYellow(`${ this.skippedTests } skipped`));
        }
        if (this.todoTests > 0) {
            summaryParts.push(makeBlue(`${ this.todoTests } todo`));
        }

        console.log(`Test Suites: ${ total }, ${ summaryParts.join(', ') }`);

        if (this.failedTests.length > 0) {
            console.log('\nFailed Tests:');
            this.failedTests.forEach(test => {
                console.log('\n' + makeRed('✕ ' + [...test.parents, test.description].join(' › ')));
                if (test.error) {
                    console.log(makeRed(this.formatError(test.error)));
                }
            });
        }
    }

    private formatError(error: unknown): string {
        if (error instanceof Error) {
            return `  ${ error.message }\n  ${ error.stack?.split('\n').slice(1).join('\n  ') }`;
        }

        return `  ${ String(error) }`;
    }
}


const reporter = new TestReporter();

export function dispatcherComponent(data: DispatcherInterface) {
    // console.log(data);
    reporter.dispatch(data);

    // Print summary when the test suite is complete
    if (data.status === StatusType.SUCCESS_DESCRIBE && data.parents.length === 0) {
        reporter.printSummary();
    }

}
