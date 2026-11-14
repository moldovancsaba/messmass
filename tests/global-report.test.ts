// tests/global-report.test.ts
// WHAT: The global report, one more owner next to organization, partner, hashtag and filter.
// WHY: It spans every client, so it must never be public: an admin session opens it, anyone else needs the page
//     password issued from its Reports workspace, shared the same way as every other report. It reuses the shared
//     aggregator, the shared workspace and the shared page-password flow, so the tests pin only what is new.

const getAdminUser = jest.fn();
const isPageProtected = jest.fn();
const hasPageAccess = jest.fn();
const getData = jest.fn();
const buildAll = jest.fn();
const notFound = jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); });

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));
jest.mock('@/lib/auth', () => ({ getAdminUser: () => getAdminUser() }));
jest.mock('@/lib/pageAccess', () => ({ isPageProtected: (...a: unknown[]) => isPageProtected(...a), hasPageAccess: (...a: unknown[]) => hasPageAccess(...a) }));
jest.mock('@/components/ServerPageGate', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/InteractiveReportDashboard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/interactive-report.module.css', () => ({ __esModule: true, default: {} }), { virtual: true });
jest.mock('@/lib/hashtagReport', () => ({ buildAllEventsReport: (...a: unknown[]) => buildAll(...a) }));
jest.mock('@/components/hashtagReport/HashtagReportView', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/interactiveReportAggregator', () => ({
  ...jest.requireActual('@/lib/interactiveReportAggregator'),
  getScopedInteractiveReportData: (...a: unknown[]) => getData(...a),
}));

import ServerPageGate from '@/components/ServerPageGate';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import GlobalInteractiveReportPage from '@/app/interactive-report/global/page';
import { resolveScopeProjectIds } from '@/lib/interactiveReportAggregator';
import { buildShareableUrl } from '@/lib/pagePassword';
import { resolveReportVariantBaseSource } from '@/lib/reportVariants';

const open = (query: { report?: string; variant?: string } = {}): Promise<any> => GlobalInteractiveReportPage({ searchParams: Promise.resolve(query) });

beforeEach(() => {
  jest.clearAllMocks();
  getData.mockResolvedValue({ success: true });
  buildAll.mockResolvedValue({ success: true });
});

describe('who can open the global report', () => {
  it('lets an admin session in without any password', async () => {
    getAdminUser.mockResolvedValue({ role: 'admin' });
    const page: any = await open();
    expect(page.type).toBe(HashtagReportView);
    expect(buildAll).toHaveBeenCalledTimes(1);
    expect(getData).not.toHaveBeenCalled();
    expect(isPageProtected).not.toHaveBeenCalled();
  });

  it('shows every event together from Fanmass data, and the previous report only at ?report=classic or a variant', async () => {
    getAdminUser.mockResolvedValue({ role: 'admin' });
    expect((await open({ report: 'classic' })).type).toBe('main');
    expect(getData).toHaveBeenCalledWith({ type: 'global', identifier: 'all' });
    expect((await open({ variant: 'q1' })).type).toBe('main');
    expect(buildAll).not.toHaveBeenCalled();
  });

  it('shows nothing, not even a login, until it was shared (no password issued)', async () => {
    getAdminUser.mockResolvedValue(null);
    isPageProtected.mockResolvedValue(false);
    await expect(open()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getData).not.toHaveBeenCalled();
    expect(buildAll).not.toHaveBeenCalled();
  });

  it('asks for the page password once it was shared, and loads no data before it is entered', async () => {
    getAdminUser.mockResolvedValue({ role: 'user' });
    isPageProtected.mockResolvedValue(true);
    hasPageAccess.mockResolvedValue(false);
    const page: any = await open();
    expect(page.type).toBe(ServerPageGate);
    expect(page.props).toMatchObject({ pageId: 'all', pageType: 'global-report' });
    expect(getData).not.toHaveBeenCalled();
    expect(buildAll).not.toHaveBeenCalled();
  });

  it('opens for a visitor who entered the page password', async () => {
    getAdminUser.mockResolvedValue(null);
    isPageProtected.mockResolvedValue(true);
    hasPageAccess.mockResolvedValue(true);
    expect((await open()).type).toBe(HashtagReportView);
    expect(buildAll).toHaveBeenCalledTimes(1);
  });
});

describe('sharing and variants work like the other reports', () => {
  it('builds the shared link at /report/global, with the variant when there is one', () => {
    expect(buildShareableUrl('global-report', 'all', 'https://www.messmass.com')).toBe('https://www.messmass.com/report/global');
    expect(buildShareableUrl('global-report', 'all::variant=q1', '')).toBe('/report/global?variant=q1');
  });

  it('is an owner of report variants named "All data"', async () => {
    const source = await resolveReportVariantBaseSource({} as never, 'global', 'all');
    expect(source).toMatchObject({ ownerType: 'global', ownerId: 'all', ownerName: 'All data' });
  });
});

describe('the global scope in the shared aggregator', () => {
  it('resolves to every project, with a global header', async () => {
    const projects = [{ _id: 'p1' }, { _id: 'p2' }];
    const find = jest.fn(() => ({ toArray: async () => projects }));
    const db = { collection: (name: string) => (name === 'projects' ? { find } : {}) };
    const scope = await resolveScopeProjectIds('global', 'all', undefined, db);
    // Every project, but only the fields the report reads (a full stats document of every project times the page out)
    expect(find).toHaveBeenCalledWith({}, { projection: expect.objectContaining({ eventName: 1, 'stats.allImages': 1, 'stats.szerencsejatekTop10': 1 }) });
    expect(Object.keys((find.mock.calls[0] as any)[1].projection)).not.toContain('stats');
    expect(scope.resolvedEventIds).toEqual(['p1', 'p2']);
    expect(scope.scopeHeader).toMatchObject({ type: 'global', id: 'all', name: 'All data' });
    // A tenant-scoped caller sees only its own organization's projects
    await resolveScopeProjectIds('global', 'all', 'org_x', db);
    expect(find).toHaveBeenLastCalledWith({ organizationId: 'org_x' }, expect.anything());
  });
});
