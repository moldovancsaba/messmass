// tests/szrt-partner-redirect.test.ts
// WHAT: /interactive-report/szrt (and the other SZRT partner links) open the automatic campaign report.
// WHY: The previous SZRT partner report is partly typed in by hand (owner 2026-11-14); it stays at ?report=classic.

const redirect = jest.fn((url: string) => { throw new Error(`REDIRECT ${url}`); });
const getData = jest.fn();

jest.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND'); }, redirect: (url: string) => redirect(url) }));
jest.mock('@/lib/interactiveReportAggregator', () => ({ getInteractiveReportData: (...a: unknown[]) => getData(...a) }));
jest.mock('@/components/theme/interactive-report/InteractiveReportDashboard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/interactive-report.module.css', () => ({ __esModule: true, default: {} }), { virtual: true });

import Page from '@/app/interactive-report/[partnerSlug]/page';

const open = (partnerSlug: string, report?: string): Promise<any> =>
  Page({ params: Promise.resolve({ partnerSlug }), searchParams: Promise.resolve({ report }) });

beforeEach(() => { jest.clearAllMocks(); getData.mockResolvedValue({ success: true }); });

it('sends every SZRT partner link to the automatic campaign report', async () => {
  for (const slug of ['szrt', 'SZRT', 'szerencsejatek', 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd']) {
    await expect(open(slug)).rejects.toThrow('REDIRECT /report/hashtag/tippmixreport2026');
  }
  expect(getData).not.toHaveBeenCalled();
});

it('keeps the previous report at ?report=classic, and leaves other partners alone', async () => {
  expect((await open('szrt', 'classic')).type).toBe('main');
  expect((await open('other-partner')).type).toBe('main');
  expect(redirect).not.toHaveBeenCalled();
});
