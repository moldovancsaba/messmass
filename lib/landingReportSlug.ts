/**
 * WHAT: Landing report slug — which report drives the main page (messmass.com) content and style
 * WHY: Main page uses the exact report page pipeline (ReportContent, style, blocks); this slug selects the report
 * HOW: Set NEXT_PUBLIC_LANDING_REPORT_SLUG to the project viewSlug (e.g. from /report/[slug])
 */
export const LANDING_REPORT_SLUG =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LANDING_REPORT_SLUG) ||
  '3409cd0f-bd27-46b3-b5fe-cb0f9882e8de';
