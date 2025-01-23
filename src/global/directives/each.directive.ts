/**
 * Import will remove at compile time
 */

import type { FunctionType } from '@interfaces/function.interface';
import type { InvokeType } from '@global/directives/interfaces/each-directive.interface';
import { printf } from '@global/components/printf.component';

export function parseTemplate(templateString: TemplateStringsArray, inputData: Array<unknown>): Array<Record<string, unknown>> {
    // Extract the column headings and remove any leading/trailing whitespace
    const headings: string[] = templateString[0].split('|').map((h: string) => h.trim());

    if (headings.length === 0 || headings.some((h) => h === '')) {
        throw new Error('Template string headings must not be empty and should contain pipe delimiters.');
    }

    if ((inputData.length % headings.length) !== 0) {
        throw new Error('Not enough arguments supplied for given headings.');
    }

    return Array.from({ length: inputData.length / headings.length }, (_, rowIndex) => {
        return headings.reduce((acc, heading, columnIndex) => {
            acc[heading] = inputData[rowIndex * headings.length + columnIndex];

            return acc;
        }, {} as Record<string, unknown>);
    });

}

export function each<T extends Array<unknown>>(executor: InvokeType, ...args: T) {
    if (args.length < 2) {
        throw new Error('`.each` must be called with at leas 2 argument or Tagged Template Literal.');
    }

    const isTemplateStrings = args[0] instanceof Array && (<any> args[0]).raw !== undefined;
    const cases: Array<unknown> = isTemplateStrings ? parseTemplate(<TemplateStringsArray> args.shift(), args) : args;

    return (name: string, blockFn: FunctionType, timeout?: number) => {
        cases.forEach((testCase, index) => {
            const parseArgs = Array.isArray(testCase) ? testCase : [ testCase ];
            executor(printf(name, parseArgs, Number(index)), blockFn, parseArgs, timeout);
        });
    };
}
