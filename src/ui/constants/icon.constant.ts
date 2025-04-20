/**
 * Imports
 */

import { Colors } from '@components/colors.component';

/**
 * Collection of pre-formatted terminal icons with appropriate colors
 *
 * These icons represent different states in testing or task execution workflows
 * and are pre-formatted with color escape sequences
 *
 * @remarks
 * Each icon combines a Unicode character with appropriate color codes
 * from the Colors enum for better visual distinction in terminal output
 *
 * @see Colors
 * @since 1.0.0
 */

export const enum ICONS {
    TODO = `${ Colors.CanaryYellow }✎${ Colors.Reset }`,
    PASSED = `${ Colors.OliveGreen }√${ Colors.Reset }`,
    FAILED = `${ Colors.BrightPink }×${ Colors.Reset }`,
    SKIPPED = `${ Colors.LightGoldenrodYellow }○${ Colors.Reset }`,
    WAITING = `${ Colors.Gray }→${ Colors.Reset }`,
    RUNNING = `${ Colors.LightOrange }⟳${ Colors.Reset }`,
}
