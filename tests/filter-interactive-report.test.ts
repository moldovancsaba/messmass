// tests/filter-interactive-report.test.ts
// WHAT: Interactive reports for saved hashtag filters.
// WHY: Ensure any filter created in Messmass can render as an interactive dashboard.

const getAdminUser = jest.fn();
const isPageProtected = jest.fn();
const hasPageAccess = jest.fn();
const getData = jest.fn();
const buildFilter = jest.fn();
const slugTags = jest.fn();
const notFound = jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); });

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));
jest.mock('@/lib/auth', () => ({ getAdminUser: () => getAdminUser() }));
jest.mock('@/lib/pageAccess', () => ({
  isPageProtected: (...a: unknown[]) => isPageProtected(...a),
  hasPageAccess: (...a: unknown[]) => hasPageAccess(...a)
}));
jest.mock('@/components/ServerPageGate', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/InteractiveReportDashboard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/interactive-report.module.css', () => ({ __esModule: true, default: {} }), { virtual: true });
jest.mock('@/lib/hashtagReport', () => ({
  buildFilterReport: (...a: unknown[]) => buildFilter(...a),
  filterSlugHashtags: (...a: unknown[]) => slugTags(...a),
}));
jest.mock('@/components/hashtagReport/HashtagReportView', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/interactiveReportAggregator', () => ({
  ...jest.requireActual('@/lib/interactiveReportAggregator'),
  getScopedInteractiveReportData: (...a: unknown[]) => getData(...a),
}));

import ServerPageGate from '@/components/ServerPageGate';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import FilterInteractiveReportPage from '@/app/interactive-report/filter/[slug]/page';
import { getReportSlug } from '@/components/theme/interactive-report/reportSlug';

const open = (slug: string, query: { report?: string; variant?: string } = {}): Promise<any> =>
  FilterInteractiveReportPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve(query) });

beforeEach(() => {
  jest.clearAllMocks();
  getData.mockResolvedValue({ success: true });
  buildFilter.mockResolvedValue({ success: true });
  slugTags.mockResolvedValue(['tippmixreport2026', 'happy']);
});

describe('Filter interactive report page access', () => {
  it('allows admin session directly without password prompt', async () => {
    getAdminUser.mockResolvedValue({ role: 'admin' });
    const page: any = await open('test-slug');
    expect(page.type).toBe(HashtagReportView);
    expect(buildFilter).toHaveBeenCalledWith(expect.anything(), ['tippmixreport2026', 'happy'], 'test-slug');
    expect(getData).not.toHaveBeenCalled();
    expect(isPageProtected).not.toHaveBeenCalled();
  });

  it('keeps the previous report at ?report=classic and for a saved variant', async () => {
    getAdminUser.mockResolvedValue({ role: 'admin' });
    expect((await open('test-slug', { report: 'classic' })).type).toBe('main');
    expect(getData).toHaveBeenCalledWith({ type: 'filter', identifier: 'test-slug' });
    expect((await open('test-slug', { variant: 'q1' })).type).toBe('main');
    expect(buildFilter).not.toHaveBeenCalled();
  });

  it('renders ServerPageGate for protected filter without session', async () => {
    getAdminUser.mockResolvedValue(null);
    isPageProtected.mockResolvedValue(true);
    hasPageAccess.mockResolvedValue(false);
    const page: any = await open('protected-filter');
    expect(page.type).toBe(ServerPageGate);
    expect(page.props).toMatchObject({ pageId: 'protected-filter', pageType: 'filter' });
    expect(getData).not.toHaveBeenCalled();
    expect(buildFilter).not.toHaveBeenCalled();
  });

  it('generates reportSlug with filter- prefix', () => {
    const slug = getReportSlug({
      scope: {
        type: 'filter',
        id: 'filter-123',
        name: 'My Filter',
      },
      partner: { id: 'p1', name: 'Partner 1' },
    } as any);
    expect(slug).toBe('filter-filter-123');
  });
});
