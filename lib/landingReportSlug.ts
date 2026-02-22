/**
 * WHAT: Landing report slug — the event where we store texts and content for the main page (messmass.com)
 * WHY: Main page uses the exact report page pipeline (ReportContent, style, blocks); this slug selects the report
 * HOW: Set NEXT_PUBLIC_LANDING_REPORT_SLUG to the project viewSlug (e.g. from /report/[slug])
 *
 * This event (84224c76-da45-4cb9-8185-9c27e2a4c466) is the single source for:
 * - Hero/footer texts (from project stats: reportTextHeroLabel, reportTextHeroTitle, reportTextHeroSub, reportTextFooterTitle).
 * - Default hero title: agentic AI reads/understands data at scale, delivers actionable dashboards, no compromise on privacy.
 * - Report content blocks and style shown in the middle of the landing page
 */
export const LANDING_REPORT_SLUG =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LANDING_REPORT_SLUG) ||
  '84224c76-da45-4cb9-8185-9c27e2a4c466';
