/**
 * Imports
 */

import { Colors, setColor } from '@components/colors.component';

/**
 * A multi-line string variable representing an ASCII art logo.
 *
 * @remarks
 * This variable contains an aesthetic ASCII logo in textual form. It might be used for terminal display,
 * banners, or branding purposes within console-based applications.
 *
 * @since 1.0.0
 */

export const asciiLogo = `
        ___      _
       |_  |    | |
__  __   | | ___| |_
\\ \\/ /   | |/ _ \\ __|
 >  </\\__/ /  __/ |_
/_/\\_\\____/ \\___|\\__|
`;

// ANSI escape codes for colors
export const cleanScreen = '\x1Bc';

/**
 * Generates a banner component with ASCII logo and version information, styled with optional color settings.
 *
 * @param activeColor - A boolean indicating whether the banner should render with active color settings. Defaults to `true`.
 * @return A formatted string containing the banner with the ASCII logo and version information.
 *
 * @remarks The component applies specific color configurations and fetches the application
 * version from the constant `__VERSION`. Ensure the `setColor` method
 * and `Colors` enum are properly defined to avoid runtime errors.
 *
 * @since 1.0.0
 */

export function bannerComponent(activeColor: boolean = true): string {
    return `
        \r${ setColor(Colors.BurntOrange, asciiLogo, activeColor) }
        \rVersion: ${ setColor(Colors.BrightPink, __VERSION, activeColor) }
    \r`;
}
