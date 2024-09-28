import { SuiteState } from '@states/suite.state';
import {
    beforeAll as beforeAllFn,
    beforeEach as beforeEachFn,
    afterAll as afterAllFn,
    afterEach as afterEachFn, afterAll
} from '@directives/hooks.directive';
import { TestModel } from '@models/test.model';

jest.mock('@states/suite.state', () => {
    return {
        SuiteState: {
            getInstance: jest.fn().mockReturnValue({
                getCurrentTest: jest.fn(),
                beforeAll: jest.fn(),
                beforeEach: jest.fn(),
                afterAll: jest.fn(),
                afterEach: jest.fn()
            })
        },
    };
});


describe('hook registration functions', () => {
    const mockHook = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('beforeAll should register a hook with state.beforeAll', () => {
        beforeAllFn(mockHook);

        expect(SuiteState.getInstance().beforeAll).toHaveBeenCalledTimes(1);
        expect(SuiteState.getInstance().beforeAll).toHaveBeenCalledWith(mockHook);
    });

    test('beforeEach should register a hook with state.beforeEach', () => {
        beforeEachFn(mockHook);

        expect(SuiteState.getInstance().beforeEach).toHaveBeenCalledTimes(1);
        expect(SuiteState.getInstance().beforeEach).toHaveBeenCalledWith(mockHook);
    });

    test('afterAll should register a hook with state.afterAll', () => {
        afterAllFn(mockHook);

        expect(SuiteState.getInstance().afterAll).toHaveBeenCalledTimes(1);
        expect(SuiteState.getInstance().afterAll).toHaveBeenCalledWith(mockHook);
    });

    test('afterEach should register a hook with state.afterEach', () => {
        afterEachFn(mockHook);

        expect(SuiteState.getInstance().afterEach).toHaveBeenCalledTimes(1);
        expect(SuiteState.getInstance().afterEach).toHaveBeenCalledWith(mockHook);
    });

    describe('error handling', () => {
        beforeEach(() => {
            (<any> SuiteState.getInstance()).getCurrentTest.mockReturnValue(new TestModel('testName', () => {}));
        });

        test('beforeAll throws error when hooks defined inside tests', () => {
            expect(() => {
                beforeAllFn(mockHook);
            }).toThrowError(`Hooks cannot be defined inside tests 'testName'`);
        });

        test('beforeEach throws error when hooks defined inside tests', () => {
            expect(() => {
                beforeEachFn(mockHook);
            }).toThrowError(`Hooks cannot be defined inside tests 'testName'`);
        });

        test('afterAll throws error when hooks defined inside tests', () => {
            expect(() => {
                afterAllFn(mockHook);
            }).toThrowError(`Hooks cannot be defined inside tests 'testName'`);
        });

        test('afterEach throws error when hooks defined inside tests', () => {
            expect(() => {
                afterEachFn(mockHook);
            }).toThrowError(`Hooks cannot be defined inside tests 'testName'`);
        });
    });
});
