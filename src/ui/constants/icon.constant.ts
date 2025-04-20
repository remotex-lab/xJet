/**
 * Imports
 */

import { Colors } from '@components/colors.component';

export const enum Icons {
    TODO = `${ Colors.CanaryYellow }�${ Colors.Reset }`,
    PASSED = `${ Colors.OliveGreen }✓${ Colors.Reset }`,
    FAILED = `${ Colors.BrightPink }✗${ Colors.Reset }`,
    SKIPPED = `${ Colors.LightGoldenrodYellow }→${ Colors.Reset }`,
    WAITING = `${ Colors.Gray }⧖${ Colors.Reset }`,
    RUNNING = `${ Colors.LightOrange }⟳${ Colors.Reset }`,
}
