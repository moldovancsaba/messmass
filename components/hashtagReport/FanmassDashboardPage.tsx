// components/hashtagReport/FanmassDashboardPage.tsx
// WHAT: The Fanmass report page: the interactive dashboard (vision charts, image proofs, territory map, demographics)
//     in its Fanmass mode, with the measured figures in its Figures tab.
// WHY: Owner 2026-11-14: "the proper fanmass report with the charts and image proofs the map and everything". One page
//     shape for every hashtag, filter and the global report; the clicker figures stay in the clicker report.

import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';
import type { InteractiveReportData } from '@/components/theme/interactive-report/types';
import { fanmassDashboardData } from '@/lib/hashtagReport/dashboard';
import type { HashtagReport } from '@/lib/hashtagReport/types';

/** `base`: the dashboard data of the same scope, for its header and the vision Fanmass published (null when absent). */
export default function FanmassDashboardPage({ report, base }: { report: HashtagReport; base: InteractiveReportData | null }) {
  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={fanmassDashboardData(base, report)} fanmass={report} />
    </main>
  );
}
