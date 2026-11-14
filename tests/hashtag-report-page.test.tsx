// tests/hashtag-report-page.test.tsx
// WHAT: /report/hashtag/[hashtag] shows the unified report for every hashtag, behind the shared page gate.
// WHY: The SZRT campaign gets the unified report too (owner 2026-11-14); its previous report stays at `?report=classic`.

const getAdminUser = jest.fn();
const isPageProtected = jest.fn();
const hasPageAccess = jest.fn();
const buildHashtagReport = jest.fn();
const getScoped = jest.fn();
const notFound = jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); });

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({}) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));
jest.mock('@/lib/auth', () => ({ getAdminUser: () => getAdminUser() }));
jest.mock('@/lib/pageAccess', () => ({ isPageProtected: (...a: unknown[]) => isPageProtected(...a), hasPageAccess: (...a: unknown[]) => hasPageAccess(...a) }));
jest.mock('@/lib/hashtagReport', () => ({ buildHashtagReport: (...a: unknown[]) => buildHashtagReport(...a) }));
jest.mock('@/lib/interactiveReportAggregator', () => ({
  ...jest.requireActual('@/lib/interactiveReportAggregator'),
  getScopedInteractiveReportData: (...a: unknown[]) => getScoped(...a),
}));
jest.mock('@/components/ServerPageGate', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/hashtagReport/HashtagReportView', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/InteractiveReportDashboard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/theme/interactive-report/interactive-report.module.css', () => ({ __esModule: true, default: {} }), { virtual: true });

import ServerPageGate from '@/components/ServerPageGate';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import Page from '@/app/interactive-report/hashtag/[hashtag]/page';

const open = (hashtag: string, report?: string): Promise<any> => Page({ params: Promise.resolve({ hashtag }), searchParams: Promise.resolve({ report }) });

beforeEach(() => {
  jest.clearAllMocks();
  getAdminUser.mockResolvedValue(null);
  isPageProtected.mockResolvedValue(false);
  hasPageAccess.mockResolvedValue(false);
  buildHashtagReport.mockResolvedValue({ success: true });
  getScoped.mockResolvedValue({ success: true });
});

describe('the hashtag report page', () => {
  it('shows the unified report for any hashtag, without its #', async () => {
    const page = await open('%23Derby2027');
    expect(page.type).toBe(HashtagReportView);
    expect(buildHashtagReport).toHaveBeenCalledWith(expect.anything(), 'Derby2027');
    expect(getScoped).not.toHaveBeenCalled();
  });

  it('asks for the page password when the hashtag has one, and builds nothing before it is entered', async () => {
    isPageProtected.mockResolvedValue(true);
    const page = await open('derby');
    expect(page.type).toBe(ServerPageGate);
    expect(page.props).toMatchObject({ pageId: 'derby', pageType: 'hashtag' });
    expect(buildHashtagReport).not.toHaveBeenCalled();
  });

  it('lets an admin session and a visitor with the password in', async () => {
    isPageProtected.mockResolvedValue(true);
    getAdminUser.mockResolvedValue({ role: 'admin' });
    expect((await open('derby')).type).toBe(HashtagReportView);
    getAdminUser.mockResolvedValue(null);
    hasPageAccess.mockResolvedValue(true);
    expect((await open('derby')).type).toBe(HashtagReportView);
  });

  it('shows the SZRT campaign the unified report, and its previous report only at ?report=classic', async () => {
    expect((await open('tippmixreport2026')).type).toBe(HashtagReportView);
    expect(getScoped).not.toHaveBeenCalled();
    const previous: any = await open('tippmixreport2026', 'classic');
    expect(previous.type).toBe('main');
    expect(previous.props.children.type).toBe(InteractiveReportDashboard);
  });
});
