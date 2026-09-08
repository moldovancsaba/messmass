// WHAT: Colours inlined into transactional HTML e-mails (lib/emailNotifications.ts).
// WHY: E-mail clients do not resolve CSS custom properties, so the values must be literal.
//      They mirror --mm-gray-100 / --mm-gray-600 / --mm-gray-900 from app/styles/theme.css.

export const EMAIL_PALETTE = {
  panelBackground: '#f3f4f6',
  mutedText: '#4b5563',
  text: '#111827',
} as const;
