'use client';

/**
 * Marketing Dashboard
 * WHAT: Analytics view for marketing stakeholders (campaign and audience focus)
 * WHY: Phase 3 — 4+ dashboard templates (executive, marketing, operations, partner)
 */
import { ExecutiveDashboardView } from '../executive/ExecutiveDashboardView';

export default function MarketingDashboardPage() {
  return (
    <ExecutiveDashboardView
      title="📣 Marketing Dashboard"
      subtitle="Campaign and audience metrics"
      defaultPeriod="30d"
    />
  );
}
