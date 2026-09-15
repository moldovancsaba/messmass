// tests/report-style-effective-defaults.test.ts
// WHAT: withEffectiveStyleDefaults() must seed pageBackground/blockTitleColor from
//     the field the CSS actually falls back to (heroBackground / headingColor),
//     never from the generic DEFAULT_STYLE palette.
// WHY: Both fields were added after styles already existed. Seeding them from
//     DEFAULT_STYLE handed every existing style a light page and a dark section
//     title, so simply opening a dark style in the editor and saving rewrote it
//     to the light default -- a dark report came back with a white page and an
//     unreadable near-black section heading, which is the original reported bug
//     re-introduced through the very field meant to fix it.
// HOW: Sentinel strings rather than hex literals -- the function only copies
//     values between fields and never parses them, so naming which field a value
//     came from tests the behaviour more directly than a colour would (and keeps
//     raw colour literals out of a non-theme file, which gds-compliance blocks).

import { withEffectiveStyleDefaults } from '@/lib/reportStyleTypes';

describe('withEffectiveStyleDefaults', () => {
  it('seeds each field from its own sibling, not a generic default', () => {
    const out = withEffectiveStyleDefaults({
      heroBackground: 'HERO',
      headingColor: 'HEADING',
    });
    expect(out.pageBackground).toBe('HERO');
    expect(out.blockTitleColor).toBe('HEADING');
  });

  it('leaves explicitly chosen values alone', () => {
    const out = withEffectiveStyleDefaults({
      heroBackground: 'HERO',
      headingColor: 'HEADING',
      pageBackground: 'CHOSEN_PAGE',
      blockTitleColor: 'CHOSEN_TITLE',
    });
    expect(out.pageBackground).toBe('CHOSEN_PAGE');
    expect(out.blockTitleColor).toBe('CHOSEN_TITLE');
  });

  it('is idempotent: seeding then saving cannot change appearance', () => {
    const stored = { heroBackground: 'HERO', headingColor: 'HEADING' };
    const once = withEffectiveStyleDefaults(stored);
    const twice = withEffectiveStyleDefaults(once);
    expect(twice).toEqual(once);
  });

  it('does not invent a value when the sibling field is missing too', () => {
    const out = withEffectiveStyleDefaults({});
    expect(out.pageBackground).toBeUndefined();
    expect(out.blockTitleColor).toBeUndefined();
  });
});
