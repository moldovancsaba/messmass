// tests/interactive-report-header.test.tsx
// WHAT: The interactive report header shows the stored opt-in count, and the rate only when the stored counts agree.
// WHY: The header used to show "n/a" in the opt-in card whenever the rate could not be derived, which hid a stored count
//     of 20,130 opt-ins behind a footnote. The count is the data; the rate is a derivation that may be missing.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SzrtHeader from '@/components/theme/interactive-report/SzrtHeader';
import D3FunnelFlow from '@/components/theme/interactive-report/D3FunnelFlow';

const summary = (over: Record<string, unknown> = {}) => ({
  totalPhotos: 14569, hostessPhotos: 9000, selfies: 5569, hostessShare: 64, selfieShare: 36,
  totalRegistered: 13572, totalOptIns: 20130, optInRate: null, vettingApprovalRate: 97.6, totalMatches: 106, totalCtaClicks: 0, ...over,
});

const header = (over: Record<string, unknown> = {}) => renderToStaticMarkup(
  <SzrtHeader
    activeTab="overview"
    onTabChange={() => undefined}
    data={{ scope: { type: 'hashtag', id: 'tippmixreport2026', name: 'Szerencsejáték Zrt.' }, partner: { name: 'Szerencsejáték Zrt.' }, summary: summary(over), matches: [], vision: null } as never}
  />,
);

describe('the opt-in figure of the report header', () => {
  it('shows the stored count when the rate cannot be derived, and says why there is no rate', () => {
    const html = header();
    expect(html).toContain('20,130');
    expect(html).toContain('Rate not shown');
    expect(html).not.toMatch(/Marketing Opt-In<\/span><span[^>]*>n\/a/);
  });

  it('shows the rate next to the count when the stored counts agree', () => {
    const html = header({ totalOptIns: 9000, optInRate: 66 });
    expect(html).toContain('9,000');
    expect(html).toContain('66% of registrations');
  });

  it('is n/a only when nothing is stored', () => {
    expect(header({ totalOptIns: 0 })).toMatch(/Marketing Opt-In<\/span><span[^>]*>n\/a/);
  });
});

describe('the opt-in highlight of the funnel', () => {
  const funnel = [{ step: 'Photo Submissions', value: 100, detail: '' }];
  const funnelHtml = (over: Record<string, unknown>) => renderToStaticMarkup(
    <D3FunnelFlow funnel={funnel as never} summary={{ optInRate: null, totalOptIns: 20130, totalRegistered: 13572, vettingApprovalRate: 97.6, totalCtaClicks: 0, ...over }} />,
  );

  it('shows the stored count, not n/a, when there is no rate', () => {
    const html = funnelHtml({});
    expect(html).toContain('20,130');
    expect(html).toContain('Rate not shown');
  });
});
