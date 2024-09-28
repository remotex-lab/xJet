import { TestMode } from '@const/test.const';
import { each, parseTemplate } from '@directives/each.directive';

describe('parseTemplate function', () => {
    test('should parse template string correctly', () => {
        const templateString: any = [ 'a | b | c' ]; // Mock template string
        const inputData = [ 1, 2, 3, 4, 5, 6 ]; // Mock input data

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            [ 1, 2, 3 ],
            [ 4, 5, 6 ]
        ]);
    });

    test('should throw error on empty headings', () => {
        const templateString: any = [ '  | b | c', '' ]; // Mock template string with empty heading
        const inputData = [ 1, 2, 3, 4, 5, 6 ]; // Mock input data

        expect(() => {
            parseTemplate(templateString, inputData);
        }).toThrow('Template string headings must not be empty and should contain pipe delimiters.');
    });

    test('should handle single row template string', () => {
        const templateString: any = [ 'a | b | c' ]; // Single row template string
        const inputData = [ 1, 2, 3 ]; // Mock input data

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            [ 1, 2, 3 ]
        ]);
    });

    test('should handle empty input data', () => {
        const templateString: any = [ 'a | b | c', '' ]; // Mock template string
        const inputData: any[] = []; // Empty input data

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([]);
    });

    test('should handle template string with leading/trailing whitespace', () => {
        const templateString: any = [ '  a  | b |   c   ', '' ]; // Template string with whitespace
        const inputData = [ 1, 2, 3, 4, 5, 6 ]; // Mock input data

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            [ 1, 2, 3 ],
            [ 4, 5, 6 ]
        ]);
    });

    test('should throw error for invalid template string format', () => {
        const value = [ 1, 2, 3, 4, 7 ];
        const header = [
            '\n         |  ||\n    ',
            '  | ',
            ' | ',
            '\n    ',
            '  | ',
            '  | ',
            '\n'
        ];

        expect(() => {
            parseTemplate(<any>header, value);
        }).toThrow('Template string headings must not be empty and should contain pipe delimiters');
    });

    test('should throw error for invalid values length', () => {
        const value = [ 1, 2, 3, 4, 7 ];
        const header = [
            '\n    a     | b     | expected\n    ',
            '  | ',
            ' |\n    ',
            '  | ',
            '  | ',
            '\n'
        ];

        expect(() => {
            parseTemplate(<any>header, value);
        }).toThrow('Not enough arguments supplied for given headings.');
    });

    test('should handle extremely large input data', () => {
        const templateString: any = [ 'a | b | c' ]; // Mock template string
        const inputData = [];
        const numberOfRows = 100000; // Number of rows to test

        // Generate a large input data set
        for (let i = 0; i < numberOfRows; i++) {
            inputData.push(i, i + 1, i + 2);
        }

        const result = parseTemplate(templateString, inputData);

        // Verify the first and last subarray to ensure correct parsing
        expect(result[0]).toEqual([ 0, 1, 2 ]);
        expect(result[numberOfRows - 1]).toEqual([ numberOfRows - 1, numberOfRows, numberOfRows + 1 ]);
        expect(result.length).toBe(numberOfRows);
    });

    test('should handle special characters in template string', () => {
        const templateString: any = [ 'a$ | b@ | c#' ]; // Template string with special characters
        const inputData = [ 'val1$', 'val2@', 'val3#', 'val4$', 'val5@', 'val6#' ]; // Input data with special characters

        const result = parseTemplate(templateString, inputData);

        expect(result).toEqual([
            [ 'val1$', 'val2@', 'val3#' ],
            [ 'val4$', 'val5@', 'val6#' ]
        ]);
    });
});

describe('each function', () => {
    const mockExecutor = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should iterate over array of arrays', () => {
        const mockCases = [
            [ 1, 2 ],
            [ 3, 4 ]
        ];

        const testFn = each(mockExecutor, { skip: false, only: true }, TestMode.DEFAULT, ...mockCases);
        testFn('sum', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: true }, [ 1, 2 ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: true }, [ 3, 4 ], TestMode.DEFAULT);
    });

    test('should handle single case without array wrapping', () => {
        const mockCase = [ 1, 2 ];

        const testFn = each(mockExecutor, { skip: false, only: true }, TestMode.DEFAULT, ...mockCase);
        testFn('sum', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: true }, [ 1 ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: true }, [ 2 ], TestMode.DEFAULT);
    });

    test('should handle empty case array', () => {
        const mockCases: any[] = [];

        expect(() => {
            const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, mockCases);
            testFn('sum', () => {
            });
        }).toThrow('`.each` must be called with at leas 2 argument or Tagged Template Literal.');
    });

    test('should handle template string with valid input', () => {
        const mockCases: any = [
            [
                '\n    a     | b     | expected\n    ',
                '  | ',
                '  | ',
                '\n    ',
                '  | ',
                '  | ',
                '\n'
            ],
            1,
            2,
            3,
            4,
            5,
            9
        ];

        mockCases[0].raw = mockCases[0];

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        testFn('$a + $b', async () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), '$a + $b', { skip: false, only: false }, [ 1, 2, 3 ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), '$a + $b', { skip: false, only: false }, [ 4, 5, 9 ], TestMode.DEFAULT);
    });

    test('should handle nested arrays', () => {
        const mockCases = [
            [ [ 1, 2 ], [ 3, 4 ] ],
            [ [ 5, 6 ], [ 7, 8 ] ]
        ];

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        testFn('nested arrays', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'nested arrays', { skip: false, only: false }, [ [ 1, 2 ], [ 3, 4 ] ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'nested arrays', { skip: false, only: false }, [ [ 5, 6 ], [ 7, 8 ] ], TestMode.DEFAULT);
    });

    test('should handle mixed types in cases', () => {
        const mockCases = [
            [ 1, 'string', true ],
            [ 2, 'another string', false ]
        ];

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        testFn('mixed types', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'mixed types', { skip: false, only: false }, [ 1, 'string', true ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'mixed types', { skip: false, only: false }, [ 2, 'another string', false ], TestMode.DEFAULT);
    });

    test('should handle different Status values', () => {
        const mockCases = [
            [ 1, 2 ],
            [ 3, 4 ]
        ];

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        testFn('sum', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: false }, [ 1, 2 ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'sum', { skip: false, only: false }, [ 3, 4 ], TestMode.DEFAULT);
    });

    test('should throw error for invalid template string', () => {
        const mockCases: any = [
            [ 'invalid | template | string' ],
            1,
            2
        ];

        mockCases[0].raw = mockCases[0];

        expect(() => {
            each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        }).toThrow('Not enough arguments supplied for given headings.');
    });

    test('should handle template string with no interpolation', () => {
        const mockCases: any = [
            [ 'a | b | c' ],
            1,
            2,
            3,
            4,
            5,
            6
        ];

        mockCases[0].raw = mockCases[0];

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, ...mockCases);
        testFn('no interpolation', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'no interpolation', { skip: false, only: false }, [ 1, 2, 3 ], TestMode.DEFAULT);
        expect(mockExecutor).toHaveBeenCalledWith(expect.any(Function), 'no interpolation', { skip: false, only: false }, [ 4, 5, 6 ], TestMode.DEFAULT);
    });

    test('should handle extremely large input data', () => {
        const largeData = Array.from({ length: 10002 }, (_, i) => i + 1); // Large input data
        const templateString: any = [ 'a | b | c' ]; // Mock template string

        templateString.raw = templateString;

        const testFn = each(mockExecutor, { skip: false, only: false }, TestMode.DEFAULT, templateString, ...largeData);
        testFn('large input', () => {
        });

        expect(mockExecutor).toHaveBeenCalledTimes(3334); // Expect 3334 calls as 10002 / 3 = 3334
    });
});
