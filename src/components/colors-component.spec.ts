/**
 * Imports
 */

import { Colors, setColor } from './colors.component';

/**
 * Tests
 */

describe('setColor', () => {
    test('should return message with color codes when activeColor is true', () => {
        const message = 'Hello World';
        const result = setColor(Colors.Red, message);
        expect(result).toBe(`${ Colors.Red }${ message }${ Colors.Reset }`);
    });

    test('should return message without color codes when activeColor is false', () => {
        const message = 'Hello World';
        const result = setColor(Colors.Red, message, false);
        expect(result).toBe(message);
    });

    test('should work with different colors', () => {
        const message = 'Test';
        const testCases = [
            Colors.Cyan,
            Colors.Gray,
            Colors.BrightPink,
            Colors.LightGray,
            Colors.OliveGreen
        ];

        testCases.forEach(color => {
            const result = setColor(color, message);
            expect(result).toBe(`${ color }${ message }${ Colors.Reset }`);
        });
    });

    test('should handle empty message', () => {
        const result = setColor(Colors.Red, '');
        expect(result).toBe(`${ Colors.Red }${ Colors.Reset }`);
    });

    test('should handle message with special characters', () => {
        const message = 'Hello\nWorld\t!';
        const result = setColor(Colors.LightYellow, message);
        expect(result).toBe(`${ Colors.LightYellow }${ message }${ Colors.Reset }`);
    });

    test('should default to activeColor=true when parameter is omitted', () => {
        const message = 'Test';
        const result = setColor(Colors.Red, message);
        expect(result).toBe(`${ Colors.Red }${ message }${ Colors.Reset }`);
    });
});
