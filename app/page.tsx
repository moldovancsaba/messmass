import type { Metadata } from 'next';
import LandingReportRoot from '@/components/LandingReportRoot';

/**
 * WHAT: Sales-oriented landing page for messmass.com (from pitch deck 2026-02-22)
 * WHY: Convert visitors with pitch-deck messaging; drive dashboard sign-in
 * HOW: LandingReportRoot fetches event + style + sections from /api/landing-report;
 *      all texts from event stats (report texts); all valuechain cards from report; style from messmass.com style.
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
  return <LandingReportRoot />;
}
