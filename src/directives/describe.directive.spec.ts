import { TestModel } from '@models/test.model';
import { SuiteState } from '@states/suite.state';
import { describe as describeFn, dispatchDescribe } from '@directives/describe.directive';

jest.mock('@states/suite.state', () => {
    return {
        SuiteState: {
            getInstance: jest.fn().mockReturnValue({
                addDescribe: jest.fn(),
                getCurrentTest: jest.fn()
            })
        },
    };
});

describe('describe function', () => {
    const mockBlockFn = jest.fn();
    const mockBlockName = 'Test Block';

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should define a test suite with the given name and default status', () => {
        describeFn(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith(mockBlockName, expect.any(Function), {});
    });

    test('should define a test suite with the given name and only status', () => {
        describeFn.only(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { only: true });
    });

    test('should define a test suite with the given name and skip status', () => {
        describeFn.skip(mockBlockName, mockBlockFn);

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith(mockBlockName, expect.any(Function), { skip: true });
    });

    test('should iterate over array of arrays using describe.each', () => {
        const mockCases = [
            [ 1, 2 ],
            [ 3, 4 ]
        ];

        const eachFn = describeFn.each(...mockCases);
        eachFn('sum', () => {});

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledTimes(2);
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), {});
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), {});
    });

    test('should iterate over array of arrays using describe.only.each', () => {
        const mockCases = [
            [ 1, 2 ],
            [ 3, 4 ]
        ];

        const eachFn = describeFn.only.each(...mockCases);
        eachFn('sum', () => {});

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledTimes(2);
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), { only: true });
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), { only: true });
    });

    test('should iterate over array of arrays using describe.skip.each', () => {
        const mockCases = [
            [ 1, 2 ],
            [ 3, 4 ]
        ];

        const eachFn = describeFn.skip.each(...mockCases);
        eachFn('sum', () => {});

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledTimes(2);
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), { skip: true });
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), { skip: true });
    });

    test('should handle single case without array wrapping using describe.each', () => {
        const mockCase = [ 1, 2 ];

        const eachFn = describeFn.each(...mockCase);
        eachFn('sum', () => {});

        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledTimes(2);
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), {});
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith('sum', expect.any(Function), {});
    });

    test('should throw error when describe defined inside tests', () => {
        (<any> SuiteState.getInstance()).getCurrentTest.mockReturnValueOnce(new TestModel('testName', () => {}));

        expect(() => {
            dispatchDescribe(() => {}, 'describeName');
        }).toThrowError('Cannot nest a describe inside a test \'describeName\' in \'testName\'');
    });

    test('should bind blockFn with args and pass to state.addDescribe', () => {
        const mockBlockFn = jest.fn();
        const mockBlockName = 'Test Block';
        const mockFlags = {};

        const mockArgs = [1, 'param', true]; // Mock args to be bound with blockFn

        // Call dispatchDescribe with mock values
        dispatchDescribe(mockBlockFn, mockBlockName, mockFlags, mockArgs);

        // Expect state.addDescribe to be called with correct parameters
        expect(SuiteState.getInstance().addDescribe).toHaveBeenCalledWith(
            mockBlockName,
            expect.any(Function), // Expect a function to be passed
            mockFlags
        );

        // Get the actual function passed to state.addDescribe
        const actualBlockFnPassed = (SuiteState.getInstance().addDescribe as jest.Mock).mock.calls[0][1];

        // Simulate invocation of the passed function with additional arguments
        actualBlockFnPassed('additionalArg');

        // Assert that mockBlockFn was called with correctly bound arguments
        expect(mockBlockFn).toHaveBeenCalledWith(...mockArgs, 'additionalArg');
    });
});
