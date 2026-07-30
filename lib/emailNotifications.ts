// lib/emailNotifications.ts
// WHAT: Email transport utility for {messmass}
// WHY: Send the transactional emails the app actually uses (admin password
//      regeneration, and an email config self-test).
// HOW: Resend HTTP API — matches camera (lib/email/submission-notification.ts),
//      standardizing the two apps on one email provider instead of messmass's
//      previous SMTP-via-nodemailer path. See SSO_EMAIL_UNIFICATION_PLAN.md
//      Phase 2. SMTP has real serverless drawbacks Resend's HTTP API avoids
//      (a raw SMTP connection per cold Vercel invocation vs. one POST), and
//      messmass's SMTP_* vars were never actually configured in production —
//      this closes that gap rather than just relocating it.
//
// Configuration: RESEND_API_KEY (server-only), EMAIL_FROM (e.g.
// '"messmass" <notifications@messmass.com>' — verified sending domain in
// Resend). SMTP_* vars are no longer read; keep them in .env.example only as
// a historical note if still wired to any external doc, not as live config.
//
// NOTE (2026-07-05 audit cleanup, still true): four functions that had ZERO
// callers were removed — sendSyncSuccessEmail, sendSyncErrorEmail,
// sendDailySyncSummaryEmail, sendContactFormEmail. The Google-Sheets sync
// writes status to the partner doc (it never emailed), and the contact route
// persists via createContactInquiry.

import { Resend } from 'resend';

function getApiKey(): string {
  return (process.env.RESEND_API_KEY || '').trim();
}

function getFromAddress(): string {
  return (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
}

function summarizeResendError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof e.message === 'string' && e.message.trim()) parts.push(e.message.trim());
    if (typeof e.name === 'string' && e.name.trim()) parts.push(`[${e.name.trim()}]`);
    if (parts.length) return parts.join(' ');
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * WHAT: Test email configuration
 * WHY: Verify Resend credentials + sender identity work before relying on them
 */
export async function testEmailConfig(recipientEmail: string): Promise<boolean> {
  const apiKey = getApiKey();
  const from = getFromAddress();

  if (!apiKey) {
    console.error('Email configuration test failed: RESEND_API_KEY is not set');
    return false;
  }
  if (!from) {
    console.error('Email configuration test failed: EMAIL_FROM is not set');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from,
      to: recipientEmail,
      subject: '✅ {messmass} Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from {messmass} to verify the Resend configuration.</p>
        <p>If you received this email, your email notifications are working correctly!</p>
        <hr>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Provider: Resend</li>
          <li>From: ${from}</li>
        </ul>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
    });

    if (response.error) {
      console.error('Email configuration test failed:', summarizeResendError(response.error));
      return false;
    }

    console.log(`✅ Test email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', summarizeResendError(error));
    return false;
  }
}

/**
 * WHAT: Send new password to user
 * WHY: Send regenerated password securely via email
 */
export async function sendPasswordRegeneratedEmail(params: {
  userEmail: string;
  password: string;
}): Promise<boolean> {
  const apiKey = getApiKey();
  const from = getFromAddress();

  if (!apiKey || !from) {
    console.error('Failed to send password email: Resend is not configured (RESEND_API_KEY / EMAIL_FROM)');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from,
      to: params.userEmail,
      subject: '🔐 {messmass} Access Password Regenerated',
      html: `
        <h2>Access Password Regenerated</h2>
        <p>A new access password has been generated for your account on {messmass}.</p>
        <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: center;">
          <p style="margin-bottom: 0.5rem; color: #4b5563; font-size: 0.875rem;">Your new password:</p>
          <code style="font-size: 1.5rem; font-weight: bold; color: #111827; letter-spacing: 0.05em;">${params.password}</code>
        </div>
        <hr>
        <p><strong>Security Instructions:</strong></p>
        <ul>
          <li>Use your email (${params.userEmail}) and the password above to log in.</li>
          <li>For security, please do not share this password with anyone.</li>
        </ul>
        <p><small>This is an automated security message from {messmass}.</small></p>
      `,
    });

    if (response.error) {
      console.error('Failed to send password email:', summarizeResendError(response.error));
      return false;
    }

    console.log(`✅ Password email sent to ${params.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send password email:', summarizeResendError(error));
    return false;
  }
}
