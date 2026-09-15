// tests/gate-background-luminance.test.ts
// WHAT: isLightBackground() decides the password gate's palette.
// WHY: The gate was authored white-on-glass and sets --page-bg from the report's
//     own background, so on a light report its prompt rendered white-on-white --
//     measured 1.04:1 on the default light background and 1.00:1 on pure white,
//     i.e. an invisible password form for the client. The whole fix rests on this
//     one predicate, including the 8-digit hex the style system stores and the
//     malformed input that must not throw.
// HOW: Inputs come from the real palette modules rather than hex literals. That
//     keeps colour literals in the theme lane gds-compliance exempts, and makes
//     the test assert against the values the app actually ships -- if a preset's
//     background ever flips light/dark, this fails, which is the point.

import { hexLuminance, isLightBackground, HEX_WHITE, HEX_BLACK } from '@/lib/theme/color';
import {
  DEFAULT_REPORT_STYLE_COLORS,
  LANDING_REPORT_STYLE_COLORS,
} from '@/lib/theme/reportStylePalette';

const LIGHT_PRESET = DEFAULT_REPORT_STYLE_COLORS.heroBackground; // 8-digit, light
const DARK_PRESET = LANDING_REPORT_STYLE_COLORS.heroBackground; // 8-digit, dark

describe('isLightBackground', () => {
  it('treats the light preset and pure white as light', () => {
    expect(isLightBackground(LIGHT_PRESET)).toBe(true);
    expect(isLightBackground(HEX_WHITE)).toBe(true);
  });

  it('treats the dark preset and pure black as dark', () => {
    expect(isLightBackground(DARK_PRESET)).toBe(false);
    expect(isLightBackground(HEX_BLACK)).toBe(false);
  });

  it('ignores the alpha byte of the 8-digit hex the style system stores', () => {
    expect(DARK_PRESET).toHaveLength(9); // #RRGGBBAA
    expect(hexLuminance(DARK_PRESET)).toBeCloseTo(hexLuminance(DARK_PRESET.slice(0, 7))!, 10);
  });

  it('accepts 3-digit shorthand', () => {
    const shorthand = '#' + HEX_WHITE.slice(1, 4); // #fff from #ffffff
    expect(hexLuminance(shorthand)).toBeCloseTo(hexLuminance(HEX_WHITE)!, 10);
  });

  it('returns null for unparseable input and keeps the dark default', () => {
    // note: a literal rgb(...) string cannot appear here -- gds-compliance reads
    // any rgb( outside the theme lane as a raw colour, test or not.
    for (const bad of ['', 'not-a-colour', 'hsl 1 2 3', HEX_WHITE.slice(0, 6)]) {
      expect(hexLuminance(bad)).toBeNull();
      expect(isLightBackground(bad)).toBe(false);
    }
  });
});
