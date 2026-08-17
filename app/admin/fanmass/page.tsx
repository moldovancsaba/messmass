// app/admin/fanmass/page.tsx
// WHAT: Fanmass's Executive Dashboard, Analytics, Run Control, Entity
//     Curation, and Settings, hosted natively inside messmass's admin —
//     fed by Fanmass's dashboard-snapshot push, never a live call back to
//     Fanmass (Fanmass has no public URL; see
//     lib/fanmassDashboardSnapshot.ts's module header).
// WHY: Phase 1 (a prior version of this page) linked out to Fanmass's own
//     web UI. That's been superseded — this page now hosts the surfaces
//     directly, per the Fanmass Unified Dashboard & Settings milestone.
// HOW: A thin server component wrapper around the client-side tab shell,
//     which owns the event picker, data fetching, and tab content.

import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import FanmassDashboardTabs from '@/components/fanmass/FanmassDashboardTabs';
import styles from './page.module.css';

export default function FanmassPage() {
  return (
    <div className={styles.wrapper}>
      <AnalyticsSectionCard title="Fanmass" subtitle="Live Fanmass data, hosted here — no external tab required.">
        <FanmassDashboardTabs />
      </AnalyticsSectionCard>
    </div>
  );
}
