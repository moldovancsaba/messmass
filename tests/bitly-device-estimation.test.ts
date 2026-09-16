// tests/bitly-device-estimation.test.ts
// WHAT: Device clicks are estimated proportionally from stored lifetime totals.
// WHY: messmass#283. estimateDeviceClicks returned hardcoded zeros behind a TODO
//     claiming "Bitly doesn't store historical device timeseries data in our
//     current schema". The data was always available — GET
//     /v4/bitlinks/{bitlink}/devices exists and simply was never called. Those
//     zeros reached the project-metrics API presented as a device breakdown,
//     which reads as "nobody used a phone" rather than "not measured".
// HOW: Calls the real estimateDeviceClicks from lib/bitly-aggregator.ts directly
//     -- it was previously not exported, so this file asserted against a hand-
//     mirrored copy of the arithmetic instead of the shipped function, which
//     could not have caught a divergence between them. Exporting it (additive;
//     nothing about its behaviour changed) closes that gap.
//
// NOTE ON BROWSERS: there is deliberately no browser equivalent here or in the
//     code. Bitly's v4 API exposes no per-bitlink browser endpoint, so the
//     browser half of #283 has no data source. The field was removed rather
//     than left returning zeros.

import { estimateDeviceClicks as estimate } from '@/lib/bitly-aggregator';

const LIFETIME = [
  { device_type: 'mobile', clicks: 600 },
  { device_type: 'desktop', clicks: 300 },
  { device_type: 'tablet', clicks: 100 },
];

describe('bitly device estimation', () => {
  it('returns the lifetime split when the range covers the whole lifetime', () => {
    expect(estimate(LIFETIME, 1000, 1000)).toEqual({
      mobile: 600, desktop: 300, tablet: 100, other: 0,
    });
  });

  it('scales proportionally for a partial range', () => {
    // 250 of 1000 lifetime clicks -> a quarter of each device total.
    expect(estimate(LIFETIME, 250, 1000)).toEqual({
      mobile: 150, desktop: 75, tablet: 25, other: 0,
    });
  });

  it('files an unrecognised device type under other rather than dropping it', () => {
    // Bitly's device_type is a free string, not an enum. A new category must
    // not silently vanish, or the parts stop summing to the whole.
    const withUnknown = [...LIFETIME, { device_type: 'smart_tv', clicks: 100 }];
    const result = estimate(withUnknown, 1100, 1100);
    expect(result.other).toBe(100);
    expect(result.mobile + result.desktop + result.tablet + result.other).toBe(1100);
  });

  it('returns zeros when no device data is stored', () => {
    // Links synced before the devices call existed have no `devices` array.
    // Zero here means "not collected for this link", and is reached only by
    // having nothing to scale — not by a hardcoded return, as it was before.
    expect(estimate([], 500, 1000)).toEqual({ mobile: 0, desktop: 0, tablet: 0, other: 0 });
  });

  it('returns zeros rather than dividing by zero on a link with no clicks', () => {
    expect(estimate(LIFETIME, 0, 0)).toEqual({ mobile: 0, desktop: 0, tablet: 0, other: 0 });
    expect(estimate(LIFETIME, 10, 0)).toEqual({ mobile: 0, desktop: 0, tablet: 0, other: 0 });
  });

  it('drops a device whose scaled share rounds to nothing', () => {
    // 1 of 1000 clicks: mobile keeps its single click, the rest round to 0 and
    // are omitted rather than reported as measured zeros.
    const result = estimate(LIFETIME, 1, 1000);
    expect(result.mobile).toBe(1);
    expect(result.desktop).toBe(0);
    expect(result.tablet).toBe(0);
  });
});

describe('the browser breakdown is gone, not stubbed', () => {
  it('no longer exists on the metrics type', () => {
    // Guards the decision: Bitly has no per-bitlink browser endpoint, so
    // re-adding this field means re-adding zeros pretending to be data.
    const src = require('fs').readFileSync(
      require('path').join(process.cwd(), 'lib/bitly-junction.types.ts'),
      'utf8'
    );
    expect(src).not.toMatch(/^\s*browserClicks:/m);
  });

  it('is not reconstructed by the aggregator', () => {
    const src = require('fs').readFileSync(
      require('path').join(process.cwd(), 'lib/bitly-aggregator.ts'),
      'utf8'
    );
    expect(src).not.toMatch(/estimateBrowserClicks\s*\(/);
  });
});
