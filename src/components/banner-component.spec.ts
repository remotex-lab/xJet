/**
 * Imports
 */

import { Colors, setColor } from '@components/colors.component';
import { asciiLogo, bannerComponent } from './banner.component';

/**
 * Mock the external dependencies
 */

jest.mock('@components/colors.component', () => ({
    Colors: {
        BurntOrange: 'burntOrange',
        BrightPink: 'brightPink'
    },
    setColor: jest.fn((color, text, active) => {
        if (!active) return text;

        return `[${color}]${text}[/${color}]`;
    })
}));

// Mock the __VERSION global constant
(<any> global).__VERSION = '1.0.0';

/**
 * Test
 */

describe('Banner Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('asciiLogo', () => {
        test('should export the correct ASCII art logo', () => {
            expect(asciiLogo).toContain('___      _');
            expect(asciiLogo).toContain('__  __   | | ___| |_');
            expect(asciiLogo).toContain('\\ \\/ /   | |/ _ \\ __|');
            expect(asciiLogo).toContain(' >  </\\__/ /  __/ |_');
            expect(asciiLogo).toContain('/_/\\_\\____/ \\___|\\__|');
        });
    });

    describe('bannerComponent', () => {
        test('should render banner with colors when activeColor is true', () => {
            const result = bannerComponent(true);

            // Check if setColor was called with correct parameters
            expect(setColor).toHaveBeenCalledWith(Colors.BurntOrange, asciiLogo, true);
            expect(setColor).toHaveBeenCalledWith(Colors.BrightPink, __VERSION, true);

            // Verify the formatted output
            expect(result).toContain('[burntOrange]');
            expect(result).toContain('[brightPink]');
            expect(result).toContain('Version:');
        });

        test('should render banner without colors when activeColor is false', () => {
            const result = bannerComponent(false);

            // Check if setColor was called with correct parameters
            expect(setColor).toHaveBeenCalledWith(Colors.BurntOrange, asciiLogo, false);
            expect(setColor).toHaveBeenCalledWith(Colors.BrightPink, __VERSION, false);

            // The result should contain the raw text without color markers
            expect(result).not.toContain('[burntOrange]');
            expect(result).not.toContain('[brightPink]');
            expect(result).toContain('Version:');
        });

        test('should use true as default value for activeColor parameter', () => {
            bannerComponent();

            // Check if setColor was called with activeColor = true
            expect(setColor).toHaveBeenCalledWith(Colors.BurntOrange, asciiLogo, true);
            expect(setColor).toHaveBeenCalledWith(Colors.BrightPink, __VERSION, true);
        });
    });
});
