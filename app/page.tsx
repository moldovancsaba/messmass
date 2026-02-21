import type { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

/**
 * WHAT: Main page (messmass.com) — same report as /report/[slug] for content and style
 * WHY: Style and content editable only in the report; no copies; uses ReportContent + same APIs
 * HOW: LandingPage uses useReportData(slug), useReportLayoutForProject(slug), useReportStyle,
 *      /api/chart-config/public, ReportCalculator; slug from NEXT_PUBLIC_LANDING_REPORT_SLUG.
 */
export const metadata: Metadata = {
  title: 'MessMass — Sovereign Decision Intelligence',
  description: 'Data privacy and agentic AI without compromises. Your data stays with you; the AI comes to it. Local-first decision intelligence for enterprises.',
  openGraph: {
    title: 'MessMass — Sovereign Decision Intelligence',
    description: 'Data privacy and agentic AI without compromises. Local-first agentic AI for data-driven companies.',
  },
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return <LandingPage />;
}
