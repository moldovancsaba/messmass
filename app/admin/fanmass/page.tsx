// app/admin/fanmass/page.tsx
// WHAT: Single entry point to fanmass's own web UI — executive dashboard,
//     analytics, run control, entity curation (rename/merge/reclassify
//     brands vs. clubs), and settings.
// WHY: fanmass already has all of this; Phase 1 of the messmass<->fanmass
//     access plan is to link out to it, not rebuild it. Deciding what (if
//     anything) gets natively integrated into messmass is a later,
//     separate plan.
// HOW: A plain server component — every link is a static URL built from
//     config.fanmassAppUrl, no client-side data fetch needed.

import config from '@/lib/config';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import styles from './page.module.css';

interface FanmassPageLink {
  title: string;
  path: string;
  description: string;
}

// WHAT: fanmass's own dashboard-tier pages, in the order they matter most
//     to an operator.
// WHY: Deliberately excludes /dashboard/messmass (fanmass's own reverse
//     integration UI for connecting to messmass — redundant to surface
//     from inside messmass itself), and the ad-hoc single-image Analyzer
//     and legacy /dashboard/review tool — both real and linkable, just
//     secondary to what this page is for. Add them here later if wanted.
const FANMASS_PAGES: FanmassPageLink[] = [
  {
    title: 'Executive Dashboard',
    path: '/dashboard/executive',
    description: 'Stakeholder-facing summary — projected audience and images, top brands, top clubs, PDF export.',
  },
  {
    title: 'Analytics',
    path: '/dashboard/analytics',
    description: 'Full analytics: measured and projected fan counts, confidence, category breakdowns.',
  },
  {
    title: 'Run Control',
    path: '/dashboard/run-control',
    description: 'Choose the active batch, start or stop directory processing, live worker progress, camera intake status.',
  },
  {
    title: 'Entity Curation',
    path: '/dashboard/annotation',
    description: 'Rename, merge, reclassify (club, federation, league, national team, brand, sponsor, unclassified), delete, and set logos for detected entities.',
  },
  {
    title: 'Settings',
    path: '/dashboard/settings',
    description: 'Dashboard layout density, analysis-pipeline defaults, local API key.',
  },
];

export default function FanmassPage() {
  const baseUrl = config.fanmassAppUrl;

  return (
    <div className={styles.wrapper}>
      <AnalyticsSectionCard
        title="Fanmass"
        subtitle="fanmass's own web UI, opened in a new tab — nothing here is re-implemented in messmass yet."
      >
        {!baseUrl ? (
          <p className={styles.emptyState}>
            <code>FANMASS_APP_URL</code> is not configured. Set it to fanmass&apos;s web UI origin
            (for example <code>http://localhost:8787</code>) to enable these links.
          </p>
        ) : (
          <div className={styles.linkGrid}>
            {FANMASS_PAGES.map((page) => (
              <div key={page.path} className={styles.linkCard}>
                <h3 className={styles.linkTitle}>{page.title}</h3>
                <p className={styles.linkDescription}>{page.description}</p>
                <a
                  href={`${baseUrl}${page.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Open {page.title} ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </AnalyticsSectionCard>
    </div>
  );
}
