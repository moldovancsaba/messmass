'use client';

// WHAT: Error boundary of every page under /admin/analytics (AI Analytics, the dashboards, Sponsorship Hub, Insights).
// WHY: A crash in one analytics view used to replace the whole admin with the application error page. Here the admin
//     shell stays, the view shows what failed with a retry, and the crash is reported to the server logger so it can be
//     found afterwards (the root boundary does the same for the rest of the application).

import { useEffect } from 'react';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';

export default function AnalyticsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      }),
    }).catch(() => {
      // Reporting must never add to the error that is being shown
    });
  }, [error]);

  return (
    <div className="page-container">
      <AnalyticsStatePanel
        variant="error"
        title="This analytics view could not be shown"
        description="Something went wrong while building it. The problem has been logged. Try again, or open another view from the Analytics menu."
        action={<button type="button" className="btn btn-secondary" onClick={reset}>Try again</button>}
      />
    </div>
  );
}
