'use client';

/**
 * Operations Dashboard
 * WHAT: Analytics view for operations (delivery and capacity focus)
 * WHY: Phase 3 — 4+ dashboard templates (executive, marketing, operations, partner)
 */
import { ExecutiveDashboardView } from '../executive/ExecutiveDashboardView';

export default function OperationsDashboardPage() {
  return (
    <ExecutiveDashboardView
      title="⚙️ Operations Dashboard"
      subtitle="Delivery and capacity metrics"
      defaultPeriod="30d"
    />
  );
}
