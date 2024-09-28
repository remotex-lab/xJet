/**
 * Mock imports
 */


/**
 * Imports
 */

import { TestMode } from '@const/test.const';
import { SuiteState } from '@states/suite.state';
import { testDescribe, test as testFn } from '@directives/test.directive';

// Mock state.getCurrentTest to return null initially
jest.mock('@states/suite.state', () => {
    return {
        SuiteState: {
            getInstance: jest.fn().mockReturnValue({
                getCurrentTest: jest.fn().mockReturnValue(null), // Mock to return null initially
                addTest: jest.fn() // Mock addTest function
            })
        },
    };
});

describe('testDescribe function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should define a test block with the given name and default status', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'MyTestSuite';

        testDescribe(mockBlockFn, mockBlockName);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.DEFAULT);
    });

    test('should define a test block with the given name and only status', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'MyOnlyTestSuite';

        testDescribe(mockBlockFn, mockBlockName, { only: true });

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { only: true }, TestMode.DEFAULT);
    });

    test('should define a test block with the given name and skip status', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'MySkippedTestSuite';

        testDescribe(mockBlockFn, mockBlockName, { skip: true });

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { skip: true }, TestMode.DEFAULT);
    });

    test('should define a test block with the given name and failing status', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'MyFailingTestSuite';

        testDescribe(mockBlockFn, mockBlockName, {}, [], TestMode.FAILING);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.FAILING);
    });

    test('should define a test block with the given name and todo status', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'MyTodoTestSuite';

        testDescribe(mockBlockFn, mockBlockName, {}, [], TestMode.TODO);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.TODO);
    });

    test('should handle single test case without additional arguments', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'SingleTestCase';

        testDescribe(mockBlockFn, mockBlockName);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.DEFAULT);
    });

    test('should throw error when trying to nest tests', () => {
        const mockRunningTest = { name: 'ParentTest' };
        (<any>SuiteState.getInstance().getCurrentTest).mockReturnValueOnce(mockRunningTest);

        const mockBlockFn = jest.fn();
        const mockBlockName = 'NestedTestSuite';

        expect(() => {
            testDescribe(mockBlockFn, mockBlockName);
        }).toThrowError(`Tests cannot be nested. '${ mockBlockName }' in '${ mockRunningTest.name }'`);
    });
});

describe('test proxy object', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should define a test block using test function', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'TestSuite';

        testFn(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.DEFAULT);
    });

    test('should define a test block with "skip" status using test.skip', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'SkippedTestSuite';

        testFn.skip(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { skip: true }, TestMode.DEFAULT);
    });

    test('should define a test block with "only" status using test.only', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'OnlyTestSuite';

        testFn.only(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { only: true }, TestMode.DEFAULT);
    });

    test('should define a test block with "todo" status using test.todo', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'TodoTestSuite';

        testFn.todo(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.TODO);
    });

    test('should define a test block with "failing" status using test.failing', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'FailingTestSuite';

        testFn.failing(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {}, TestMode.FAILING);
    });

    test('should define parameterized test blocks using test.each', () => {
        const mockCases = [
            [ 1, 2, 3 ],
            [ 4, 5, 9 ]
        ];

        const eachFn = testFn.each(...mockCases);
        eachFn('ParameterizedTest', ([a, b, expected], done) => {
            expect(a + b).toBe(expected);
        });

        expect(SuiteState.getInstance().addTest).toHaveBeenCalledTimes(2);
        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith('ParameterizedTest', expect.any(Function), {}, TestMode.DEFAULT);
        expect(SuiteState.getInstance().addTest).toHaveBeenCalledWith('ParameterizedTest', expect.any(Function), {}, TestMode.DEFAULT);
    });
});
