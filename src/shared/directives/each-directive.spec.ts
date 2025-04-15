/**
 * Imports
 */

import { each, parseTemplate } from '@shared/directives/each.directive';

/**
 * Tests
 */

describe('parseTemplate', () => {
    test('should parse template strings with corresponding values', () => {
        // Create a template string array to simulate the tagged template literal
        const templateString = Object.assign([ 'name|age|role' ], { raw: [ 'name|age|role' ] });
        const inputData = [ 'John', 30, 'Developer', 'Jane', 25, 'Designer' ];

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            { name: 'John', age: 30, role: 'Developer' },
            { name: 'Jane', age: 25, role: 'Designer' }
        ]);
    });

    test('should handle template with single column', () => {
        const templateString = Object.assign([ 'value' ], { raw: [ 'value' ] });
        const inputData = [ 1, 2, 3 ];

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            { value: 1 },
            { value: 2 },
            { value: 3 }
        ]);
    });

    test('should trim whitespace from column headings', () => {
        const templateString = Object.assign([ ' name | age ' ], { raw: [ ' name | age ' ] });
        const inputData = [ 'John', 30, 'Jane', 25 ];

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 }
        ]);
    });

    test('should throw error when headings are empty', () => {
        const templateString = Object.assign([ '' ], { raw: [ '' ] });
        const inputData = [ 1, 2, 3 ];

        expect(() => parseTemplate(templateString, inputData))
            .toThrow('Template string headings must not be empty and should contain pipe delimiters.');
    });

    test('should throw error when a heading is empty', () => {
        const templateString = Object.assign([ 'name||age' ], { raw: [ 'name||age' ] });
        const inputData = [ 'John', '', 30 ];

        expect(() => parseTemplate(templateString, inputData))
            .toThrow('Template string headings must not be empty and should contain pipe delimiters.');
    });

    test('should throw error when input data length is not a multiple of headings length', () => {
        const templateString = Object.assign([ 'name|age|role' ], { raw: [ 'name|age|role' ] });
        const inputData = [ 'John', 30, 'Developer', 'Jane', 25 ]; // Missing one value

        expect(() => parseTemplate(templateString, inputData))
            .toThrow('Not enough arguments supplied for given headings.');
    });
});

describe('each', () => {
    // Mock the executor function
    const mockExecutor = jest.fn();
    // Mock the printf function
    jest.mock('@shared/components/printf.component', () => ({
        printf: (name: string, args: unknown[], index: number) => `${name} - ${index}`
    }));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should handle direct arguments', () => {
        const mockFn = jest.fn();
        const testName = 'test with - %s';

        const eachFn = each(mockExecutor, 1, 2, 3);
        eachFn(testName, mockFn);

        expect(mockExecutor).toHaveBeenCalledTimes(3);
        expect(mockExecutor).toHaveBeenNthCalledWith(1, 'test with - 1', mockFn, [ 1 ], undefined);
        expect(mockExecutor).toHaveBeenNthCalledWith(2, 'test with - 2', mockFn, [ 2 ], undefined);
        expect(mockExecutor).toHaveBeenNthCalledWith(3, 'test with - 3', mockFn, [ 3 ], undefined);
    });

    test('should handle template strings', () => {
        // Mock the parseTemplate function for this test
        const mockTemplateResult = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 }
        ];

        // Create a template string and provide the shift method
        const args: any = [ 'name|age' ];
        args.raw = [ 'name|age' ];
        args.shift = jest.fn().mockReturnValue(args);

        // Mock that parseTemplate returns our mock result
        const realParseTemplate = parseTemplate;
        (parseTemplate as jest.Mock) = jest.fn().mockReturnValue(mockTemplateResult);

        const mockFn = jest.fn();
        const testName = 'User $name is $age years old';

        const eachFn = each(mockExecutor, args, 'John', 30, 'Jane', 25);
        eachFn(testName, mockFn);

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenNthCalledWith(1, 'User John is 30 years old', mockFn, [ mockTemplateResult[0] ], undefined);
        expect(mockExecutor).toHaveBeenNthCalledWith(2, 'User Jane is 25 years old', mockFn, [ mockTemplateResult[1] ], undefined);

        // Restore the original parseTemplate function
        (parseTemplate as any) = realParseTemplate;
    });

    test('should handle array test cases', () => {
        const mockFn = jest.fn();
        const testName = 'test with arrays %d, %d';

        const eachFn = each(mockExecutor, [ 1, 2 ], [ 3, 4 ]);
        eachFn(testName, mockFn);

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenNthCalledWith(1, 'test with arrays 1, 2', mockFn, [ 1, 2 ], undefined);
        expect(mockExecutor).toHaveBeenNthCalledWith(2, 'test with arrays 3, 4', mockFn, [ 3, 4 ], undefined);
    });

    test('should pass timeout to executor', () => {
        const mockFn = jest.fn();
        const testName = 'test with timeout';
        const timeout = 5000;

        const eachFn = each(mockExecutor, 1, 2);
        eachFn(testName, mockFn, timeout);

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenNthCalledWith(1, 'test with timeout', mockFn, [ 1 ], timeout);
        expect(mockExecutor).toHaveBeenNthCalledWith(2, 'test with timeout', mockFn, [ 2 ], timeout);
    });

    test('should throw error when called with fewer than 2 arguments', () => {
        expect(() => each(mockExecutor, 1))
            .toThrow('`.each` must be called with at leas 2 argument or Tagged Template Literal.');
    });
});
