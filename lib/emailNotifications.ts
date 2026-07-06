// lib/emailNotifications.ts
// WHAT: Email transport utility for {messmass}
// WHY: Send the transactional emails the app actually uses (admin password
//      regeneration, and an SMTP config self-test).
// HOW: SMTP via nodemailer.
//
// NOTE (2026-07-05 audit cleanup): four functions that had ZERO callers were
// removed — sendSyncSuccessEmail, sendSyncErrorEmail, sendDailySyncSummaryEmail,
// sendContactFormEmail. The Google-Sheets sync writes status to the partner doc
// (it never emailed), and the contact route persists via createContactInquiry.
// The in-app notification system does NOT send email; if alert emails for
// webhook failures are wanted, wire them explicitly from a single server-side
// path rather than reintroducing orphaned helpers.
//
// SMTP configuration is read from environment variables (documented in
// .env.example): SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
// SMTP_FROM / EMAIL_FROM.

const nodemailer = require('nodemailer');

/**
 * WHAT: Email configuration from environment variables
 * WHY: SMTP credentials for transactional email
 */
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  from: process.env.SMTP_FROM || process.env.EMAIL_FROM
};

/**
 * WHAT: Create SMTP transporter instance
 * WHY: Reusable email client
 */
function createTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in environment variables.');
  }

  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth
  });
}

/**
 * WHAT: Test email configuration
 * WHY: Verify SMTP credentials work before production
 */
export async function testEmailConfig(recipientEmail: string): Promise<boolean> {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipientEmail,
      subject: '✅ {messmass} Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from {messmass} to verify SMTP configuration.</p>
        <p>If you received this email, your email notifications are working correctly!</p>
        <hr>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${EMAIL_CONFIG.host}</li>
          <li>SMTP Port: ${EMAIL_CONFIG.port}</li>
          <li>From: ${EMAIL_CONFIG.from}</li>
        </ul>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `
    });

    console.log(`✅ Test email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
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
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
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
      `
    });

    console.log(`✅ Password email sent to ${params.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send password email:', error);
    return false;
  }
}
