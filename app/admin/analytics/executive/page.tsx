'use client';

/**
 * Executive Dashboard
 * WHAT: High-level analytics dashboard for executives and stakeholders
 * WHY: Provide at-a-glance view of key performance indicators across all events
 * HOW: Shared ExecutiveDashboardView with executive defaults
 */
import { ExecutiveDashboardView } from './ExecutiveDashboardView';

export default function ExecutiveDashboardPage() {
  return (
    <ExecutiveDashboardView
      title="📊 Executive Dashboard"
      subtitle="Real-time analytics across all events"
      defaultPeriod="30d"
    />
  );
}
