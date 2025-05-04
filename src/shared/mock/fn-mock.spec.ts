/**
 * Imports
 */

import { MockState } from '@shared/states/mock.state';
import { fnImplementation, getParentObject, mockImplementation } from '@shared/mock/fn.mock';

/**
 * Tests
 */

describe('fn', () => {
    test('should create a mock instance with default implementation', () => {
        const mock = fnImplementation();

        expect(mock).toBeInstanceOf(MockState); // Check if the created instance is a MockState
        expect(mock.name).toBe('xJet.fn()'); // Verify default name
        expect(mock.mock.calls).toEqual([]); // Ensure no calls are tracked initially
        expect(mock.mock.results).toEqual([]); // Ensure no results are tracked initially
    });

    test('should create a mock instance with custom implementation', () => {
        const implementation = jest.fn().mockReturnValue('mock result');
        const mock = fnImplementation(implementation);

        const result = mock('arg1', 'arg2'); // Call the mockImplementation with arguments

        expect(result).toBe('mock result'); // Verify the implementation result
        expect(implementation).toHaveBeenCalledWith('arg1', 'arg2'); // Confirm implementation was called with correct arguments
        expect(mock.mock.calls).toEqual([[ 'arg1', 'arg2' ]]); // Ensure the call was tracked properly
    });

    test('should create a mock instance with a custom restore function', () => {
        const implementation = jest.fn().mockReturnValue('mock result');
        const restore = jest.fn();
        const mock = fnImplementation(implementation, restore);

        mock.mockRestore(); // Call mockRestore

        expect(restore).toHaveBeenCalled(); // Verify restore function is called
    });

    test('should create a mock instance with no initial implementation and return undefined by default', () => {
        const mock = fnImplementation();

        const result = mock('arg1'); // Call the mockImplementation without an implementation

        expect(result).toBeUndefined(); // Default return value should be undefined
        expect(mock.mock.calls).toEqual([[ 'arg1' ]]); // Ensure call tracking works even with no implementation
    });

    test('should allow modifying the mock implementation after creation', () => {
        const mock = fnImplementation();

        mock.mockImplementation(() => 'new result'); // Add implementation later
        const result = mock('arg1');

        expect(result).toBe('new result'); // Ensure the new implementation works
        expect(mock.mock.calls).toEqual([[ 'arg1' ]]); // Verify tracked calls
    });

    test('should correctly manage queued implementation with `mockImplementationOnce`', () => {
        const mock = fnImplementation();

        mock.mockImplementationOnce(() => 'result once').mockImplementation(() => 'default result');

        const firstCall = mock('arg1');
        const secondCall = mock('arg2');

        expect(firstCall).toBe('result once'); // First call uses one-time implementation
        expect(secondCall).toBe('default result'); // Second call uses default implementation
        expect(mock.mock.calls).toEqual([[ 'arg1' ], [ 'arg2' ]]);
    });
});

describe('mock', () => {
    test('should return the provided mock if the method is already mocked', () => {
        const mockFunction = fnImplementation();
        const result = mockImplementation(mockFunction);

        expect(result).toBe(mockFunction); // Same instance should be returned
    });

    test('should throw an error if the method is not part of an object', () => {
        const standaloneFunction = () => 'not part of an object';

        expect(() => mockImplementation(standaloneFunction)).toThrowError('Method is not part of an object');
    });

    test('should create a new mock for a regular function and replace the parent object\'s original method', () => {
        const parentObject = {
            testMethod: function (arg: string) {
                return `Hello, ${arg}`;
            }
        };

        (<any> globalThis).parentObject = parentObject;
        const mockedMethod = mockImplementation(parentObject.testMethod);

        // Confirm that the parent object method is replaced with the mock
        expect(parentObject.testMethod).toBeInstanceOf(MockState);
        expect(mockedMethod).toBeInstanceOf(MockState);

        // Call the mocked method
        const result = parentObject.testMethod('World');

        // Verify the mock behavior
        expect(result).toBe('Hello, World'); // Mock has no default implementation
        expect(mockedMethod.mock.calls).toEqual([[ 'World' ]]);
    });

    test('should restore the original function after calling mockRestore on a regular function', () => {
        const parentObject = {
            testMethod: function (arg: string) {
                return `Hello, ${arg}`;
            }
        };

        (<any> globalThis).xxx = 'parentObject';
        (<any> globalThis).parentObject = parentObject;
        const mockedMethod = mockImplementation(parentObject.testMethod);

        // Restore the original function
        mockedMethod.mockRestore();

        // Confirm that the original function is restored
        expect(parentObject.testMethod).not.toBeInstanceOf(MockState);
        expect(parentObject.testMethod('World')).toBe('Hello, World');
    });

    test('should Selected part for constructor-like methods', () => {
        class ParentClass {
            static createInstance() {
                return new ParentClass();
            }
        }

        (<any> globalThis).ParentClass = ParentClass;
        const mockedConstructor = mockImplementation(ParentClass.createInstance);

        // Verify that the constructor-like method is mocked
        expect(ParentClass.createInstance).toBeInstanceOf(MockState);
        expect(mockedConstructor).toBeInstanceOf(MockState);

        const result = ParentClass.createInstance();

        // Since the constructor is mocked, the default behavior is unimplemented
        expect(result).toBeInstanceOf(ParentClass);
        expect(mockedConstructor.mock.calls).toHaveLength(1);
    });

    test('should restore the original constructor-like method when mockRestore is called', () => {
        class ParentClass {
            static createInstance() {
                return new ParentClass();
            }
        }

        (<any> globalThis).ParentClass = ParentClass;
        const mockedConstructor = mockImplementation(ParentClass.createInstance);

        // Restore the original constructor
        mockedConstructor.mockRestore();

        // Confirm that the original constructor is restored
        expect(ParentClass.createInstance).not.toBeInstanceOf(MockState);
        expect(ParentClass.createInstance()).toBeInstanceOf(ParentClass);
    });

    test('should Selected part for constructor-like methods', () => {
        class ParentClass {
            constructor() {
            }
        }

        (<any> globalThis).ParentClass = ParentClass;
        const mockedConstructor = mockImplementation(ParentClass);
        (<any> mockedConstructor)._isMockFunction = true;
        (<any> mockedConstructor).getMockName = () => mockedConstructor.name;

        // Verify that the constructor-like method is mocked
        const result = new (<any> globalThis).ParentClass();

        // Since the constructor is mocked, the default behavior is unimplemented
        expect(result).toBeInstanceOf(ParentClass);
        expect(mockedConstructor).toHaveBeenCalledTimes(1);

        mockedConstructor.mockRestore();
        new (<any> globalThis).ParentClass();
        expect(mockedConstructor).toHaveBeenCalledTimes(0);
    });

    test('should throw an error for invalid method types', () => {
        const invalidMethod: any = 123; // Not a function

        expect(() => mockImplementation(invalidMethod)).toThrowError('Invalid method type');
    });
});

describe('getParentObject', () => {
    // Test case: Function is part of the global scope
    test('should return globalThis when the function exists in the global scope', () => {
        function testGlobalFunction() {

        }

        // Define a global function
        (<any> globalThis).testGlobalFunction = testGlobalFunction;
        expect(getParentObject((<any> globalThis).testGlobalFunction)).toBe(globalThis);
    });

    // Test case: Function is part of an object
    test('should return the parent object when the function exists within it', () => {
        const parentObject = {
            testFunction: function () {}
        };

        (<any> globalThis).parentObject = parentObject;
        expect(getParentObject(parentObject.testFunction)).toBe(parentObject);
    });

    // Test case: Function does not exist in the global scope or an object
    test('should return undefined when the function does not belong to any global or object scope', () => {
        function standaloneFunction() {}
        expect(getParentObject(standaloneFunction)).toBeUndefined();
    });

    // Test case: Parent object contains non-function and non-object types
    test('should skip non-object, non-function properties of the global object', () => {
        const parentObject = {
            testFunction: function () {},
            nonObject: 42
        };

        (<any> globalThis).parentObject = parentObject;
        expect(getParentObject(parentObject.testFunction)).toBe(parentObject);
    });

    // Test case: Function exists in nested objects
    test('should not return a nested object, only direct parent', () => {
        const nestedObject = {
            parent: {
                child: {
                    nestedFunction: function () {}
                }
            }
        };

        expect(getParentObject(nestedObject.parent.child.nestedFunction)).toBeUndefined(); // Based on current logic from code
    });

    // Test case: Function has no explicit name
    test('should return undefined for anonymous functions', () => {
        expect(getParentObject(() => {})).toBeUndefined();
    });
});
