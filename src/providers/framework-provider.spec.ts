/**
 * Imports
 */

import { SourceService } from '@remotex-labs/xmap';
import { FrameworkProvider } from '@providers/framework.provider';

/**
 * Mock dependencies
 */

jest.mock('@remotex-labs/xmap', () => ({
    SourceService: jest.fn()
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn()
}));

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    dirname: jest.fn(path => path.substring(0, path.lastIndexOf('/')))
}));

/**
 * Tests
 */

describe('FrameworkProvider', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    // Reset the singleton after each test
    afterEach(() => {
        // Access and reset the private static instance
        // Using any to bypass TypeScript's private access restrictions for testing
        (FrameworkProvider as any).instance = undefined;
    });

    describe('getInstance', () => {
        test('should create a singleton instance', () => {
            const instance1 = FrameworkProvider.getInstance();
            const instance2 = FrameworkProvider.getInstance();

            expect(instance1).toBeDefined();
            expect(instance2).toBeDefined();
            expect(instance1).toBe(instance2);
        });
    });

    describe('paths', () => {
        test('should return framework paths', () => {
            const frameworkProvider = FrameworkProvider.getInstance();
            const paths = frameworkProvider.paths;

            expect(paths).toBeDefined();
            expect(paths).toHaveProperty('root');
            expect(paths).toHaveProperty('dist');
            expect(paths).toHaveProperty('framework');
        });
    });

    describe('configuration', () => {
        test('should return configuration source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the configuration using private property access for testing
            // Using any to bypass TypeScript's private access restrictions
            (frameworkProvider as any).configurationSourceMap = mockSourceService;

            expect(frameworkProvider.configuration).toBe(mockSourceService);
        });

        test('should return undefined when configuration source map is not available', () => {
            const frameworkProvider = FrameworkProvider.getInstance();

            // Ensure configuration source map is undefined
            (frameworkProvider as any).configurationSourceMap = undefined;

            expect(frameworkProvider.configuration).toBeUndefined();
        });
    });

    describe('configuration setter', () => {
        test('should set configuration source map service', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const mockSourceService = new SourceService('') as jest.Mocked<SourceService>;

            // Act
            frameworkProvider.configuration = mockSourceService;

            // Assert
            expect(frameworkProvider.configuration).toBe(mockSourceService);
        });

        test('should override existing configuration source map', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const initialMockService = new SourceService('') as jest.Mocked<SourceService>;
            const newMockService = new SourceService('') as jest.Mocked<SourceService>;

            // Act
            frameworkProvider.configuration = initialMockService;
            const initialConfiguration = frameworkProvider.configuration;

            frameworkProvider.configuration = newMockService;
            const updatedConfiguration = frameworkProvider.configuration;

            // Assert
            expect(initialConfiguration).toBe(initialMockService);
            expect(updatedConfiguration).toBe(newMockService);
            expect(initialConfiguration).not.toBe(updatedConfiguration);
        });

        test('should accept undefined to remove configuration source map', () => {
            // Arrange
            const frameworkProvider = FrameworkProvider.getInstance();
            const mockSourceService = new SourceService('') as jest.Mocked<SourceService>;

            // Act - first set a value, then set to undefined
            frameworkProvider.configuration = mockSourceService;
            expect(frameworkProvider.configuration).toBe(mockSourceService);

            frameworkProvider.configuration = <any> undefined;

            // Assert
            expect(frameworkProvider.configuration).toBeUndefined();
        });
    });

    describe('Error handling', () => {
        test('should handle errors when source service initialization fails', () => {
            // Mock SourceService constructor to throw an error
            (SourceService as jest.Mock).mockImplementation(() => {
                throw new Error('Source service initialization failed');
            });

            // This shouldn't throw an error but handle it gracefully
            const frameworkProvider = FrameworkProvider.getInstance();
            expect(frameworkProvider).toBeDefined();
        });
    });

    describe('global', () => {
        test('should return global source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the global source map using private property access for testing
            (frameworkProvider as any).globalSourceMap = mockSourceService;

            expect(frameworkProvider.global).toBe(mockSourceService);
        });
    });

    describe('framework', () => {
        test('should return framework source map when available', () => {
            const mockSourceService = {} as SourceService;
            const frameworkProvider = FrameworkProvider.getInstance();

            // Set the framework source map using private property access for testing
            (frameworkProvider as any).frameworkSourceMap = mockSourceService;

            expect(frameworkProvider.framework).toBe(mockSourceService);
        });
    });
});
