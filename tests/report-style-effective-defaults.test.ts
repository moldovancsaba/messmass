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

import { withEffectiveStyleDefaults } from '@/lib/reportStyleTypes';

describe('withEffectiveStyleDefaults', () => {
  it('seeds a dark style from its own palette, not the light default', () => {
    const out = withEffectiveStyleDefaults({
      heroBackground: '#34003eff',
      headingColor: '#ffffffff',
    });
    expect(out.pageBackground).toBe('#34003eff');
    expect(out.blockTitleColor).toBe('#ffffffff');
  });

  it('leaves explicitly chosen values alone', () => {
    const out = withEffectiveStyleDefaults({
      heroBackground: '#34003eff',
      headingColor: '#ffffffff',
      pageBackground: '#123456ff',
      blockTitleColor: '#abcdefff',
    });
    expect(out.pageBackground).toBe('#123456ff');
    expect(out.blockTitleColor).toBe('#abcdefff');
  });

  it('is a no-op round trip: seeding then saving cannot change appearance', () => {
    const stored = { heroBackground: '#0f172aff', headingColor: '#f8fafcff' };
    const once = withEffectiveStyleDefaults(stored);
    const twice = withEffectiveStyleDefaults(once);
    expect(twice).toEqual(once);
  });

  it('does not invent a colour when the sibling field is missing too', () => {
    const out = withEffectiveStyleDefaults({});
    expect(out.pageBackground).toBeUndefined();
    expect(out.blockTitleColor).toBeUndefined();
  });
});
